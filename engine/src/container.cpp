#include "container.hpp"
#include "sha256.hpp"
#include <fstream>
#include <cstring>
#include <algorithm>

namespace compressx {

namespace {

void writeUint16LE(std::vector<uint8_t>& buf, uint16_t val) {
    buf.push_back(static_cast<uint8_t>(val & 0xFF));
    buf.push_back(static_cast<uint8_t>((val >> 8) & 0xFF));
}

void writeUint32LE(std::vector<uint8_t>& buf, uint32_t val) {
    buf.push_back(static_cast<uint8_t>(val & 0xFF));
    buf.push_back(static_cast<uint8_t>((val >> 8) & 0xFF));
    buf.push_back(static_cast<uint8_t>((val >> 16) & 0xFF));
    buf.push_back(static_cast<uint8_t>((val >> 24) & 0xFF));
}

void writeUint64LE(std::vector<uint8_t>& buf, uint64_t val) {
    for (int i = 0; i < 8; ++i) {
        buf.push_back(static_cast<uint8_t>((val >> (i * 8)) & 0xFF));
    }
}

uint16_t readUint16LE(const uint8_t* p) {
    return static_cast<uint16_t>(p[0]) |
          (static_cast<uint16_t>(p[1]) << 8);
}

uint32_t readUint32LE(const uint8_t* p) {
    return static_cast<uint32_t>(p[0]) |
          (static_cast<uint32_t>(p[1]) << 8) |
          (static_cast<uint32_t>(p[2]) << 16) |
          (static_cast<uint32_t>(p[3]) << 24);
}

uint64_t readUint64LE(const uint8_t* p) {
    uint64_t val = 0;
    for (int i = 0; i < 8; ++i) {
        val |= (static_cast<uint64_t>(p[i]) << (i * 8));
    }
    return val;
}

} // anonymous namespace

std::string Container::sanitizeFilename(const std::string& rawName) {
    if (rawName.empty()) return "recovered_file.bin";

    // Strip directory paths (both / and \)
    std::string clean = rawName;
    size_t lastSlash = clean.find_last_of("/\\");
    if (lastSlash != std::string::npos) {
        clean = clean.substr(lastSlash + 1);
    }

    // Strip illegal characters and directory traversal
    std::string safe;
    for (char c : clean) {
        if (c == '/' || c == '\\' || c == ':' || c == '*' || c == '?' ||
            c == '"' || c == '<' || c == '>' || c == '|' || c < 32) {
            safe += '_';
        } else {
            safe += c;
        }
    }

    if (safe.empty() || safe == "." || safe == "..") {
        return "recovered_file.bin";
    }

    if (safe.size() > 255) {
        safe = safe.substr(safe.size() - 255);
    }
    return safe;
}

bool Container::pack(AlgorithmType algo,
                     const std::string& originalFilename,
                     uint64_t originalSize,
                     const std::vector<uint8_t>& originalSha256,
                     uint8_t validBitsInLastByte,
                     const std::vector<uint8_t>& metadata,
                     const std::vector<uint8_t>& payload,
                     std::vector<uint8_t>& outContainer) {
    outContainer.clear();

    std::string safeName = sanitizeFilename(originalFilename);
    uint16_t nameLen = static_cast<uint16_t>(safeName.size());
    uint32_t metaLen = static_cast<uint32_t>(metadata.size());
    uint64_t payloadLen = payload.size();

    // Magic "CPX1"
    outContainer.push_back('C');
    outContainer.push_back('P');
    outContainer.push_back('X');
    outContainer.push_back('1');

    // Version (uint16)
    writeUint16LE(outContainer, CPX_VERSION);

    // Algorithm (uint8)
    outContainer.push_back(static_cast<uint8_t>(algo));

    // Flags (valid bits in last byte for Huffman: 0..8)
    outContainer.push_back(validBitsInLastByte & 0x0F);

    // Original size (uint64)
    writeUint64LE(outContainer, originalSize);

    // Original SHA-256 (32 bytes)
    if (originalSha256.size() == 32) {
        outContainer.insert(outContainer.end(), originalSha256.begin(), originalSha256.end());
    } else {
        outContainer.insert(outContainer.end(), 32, 0);
    }

    // Filename length and filename
    writeUint16LE(outContainer, nameLen);
    outContainer.insert(outContainer.end(), safeName.begin(), safeName.end());

    // Metadata length and metadata
    writeUint32LE(outContainer, metaLen);
    if (metaLen > 0) {
        outContainer.insert(outContainer.end(), metadata.begin(), metadata.end());
    }

    // Payload length and payload
    writeUint64LE(outContainer, payloadLen);
    if (payloadLen > 0) {
        outContainer.insert(outContainer.end(), payload.begin(), payload.end());
    }

    // Container SHA-256 Checksum over all bytes written so far
    SHA256 sha;
    sha.update(outContainer.data(), outContainer.size());
    std::vector<uint8_t> checksum = sha.digest();
    outContainer.insert(outContainer.end(), checksum.begin(), checksum.end());

    return true;
}

bool Container::unpack(const uint8_t* containerData, size_t containerSize,
                       ContainerHeader& outHeader,
                       const uint8_t*& outPayloadPtr,
                       std::string& outErrorMessage) {
    outErrorMessage.clear();
    outPayloadPtr = nullptr;

    // Minimum valid container size:
    // 4 (magic) + 2 (ver) + 1 (algo) + 1 (flags) + 8 (origSize) + 32 (sha256) + 2 (nameLen) +
    // 4 (metaLen) + 8 (payloadLen) + 32 (checksum) = 92 bytes
    if (containerSize < 92) {
        outErrorMessage = "File too small or truncated to be a valid CPX container.";
        return false;
    }

    // 1. Verify container checksum first to detect any truncation or bit corruption
    size_t contentSize = containerSize - 32;
    SHA256 sha;
    sha.update(containerData, contentSize);
    std::vector<uint8_t> computedChecksum = sha.digest();
    if (std::memcmp(containerData + contentSize, computedChecksum.data(), 32) != 0) {
        outErrorMessage = "Container integrity verification failed: Checksum mismatch (corrupted file).";
        return false;
    }

    size_t pos = 0;

    // 2. Magic
    if (containerData[0] != 'C' || containerData[1] != 'P' ||
        containerData[2] != 'X' || containerData[3] != '1') {
        outErrorMessage = "Invalid file signature: Not a CompressX (.cpx) container.";
        return false;
    }
    outHeader.magic = CPX_MAGIC;
    pos += 4;

    // 3. Version
    outHeader.version = readUint16LE(containerData + pos);
    pos += 2;
    if (outHeader.version != CPX_VERSION) {
        outErrorMessage = "Unsupported container version: " + std::to_string(outHeader.version);
        return false;
    }

    // 4. Algorithm
    outHeader.algorithm = containerData[pos++];
    if (outHeader.algorithm > 2) {
        outErrorMessage = "Unsupported compression algorithm identifier: " + std::to_string(outHeader.algorithm);
        return false;
    }

    // 5. Flags
    outHeader.flags = containerData[pos++];

    // 6. Original Size
    outHeader.originalSize = readUint64LE(containerData + pos);
    pos += 8;

    // 7. Original SHA-256
    std::memcpy(outHeader.originalSha256, containerData + pos, 32);
    pos += 32;

    // 8. Filename
    uint16_t nameLen = readUint16LE(containerData + pos);
    pos += 2;
    if (pos + nameLen > contentSize) {
        outErrorMessage = "Malformed container: Filename length exceeds container boundary.";
        return false;
    }
    outHeader.originalFilename = sanitizeFilename(std::string(reinterpret_cast<const char*>(containerData + pos), nameLen));
    pos += nameLen;

    // 9. Metadata
    if (pos + 4 > contentSize) {
        outErrorMessage = "Malformed container: Truncated metadata header.";
        return false;
    }
    uint32_t metaLen = readUint32LE(containerData + pos);
    pos += 4;
    if (pos + metaLen > contentSize) {
        outErrorMessage = "Malformed container: Metadata length exceeds container boundary.";
        return false;
    }
    outHeader.metadata.assign(containerData + pos, containerData + pos + metaLen);
    pos += metaLen;

    // 10. Payload
    if (pos + 8 > contentSize) {
        outErrorMessage = "Malformed container: Truncated payload header.";
        return false;
    }
    outHeader.payloadSize = readUint64LE(containerData + pos);
    pos += 8;
    if (pos + outHeader.payloadSize != contentSize) {
        outErrorMessage = "Malformed container: Stored payload length does not match container size.";
        return false;
    }

    outPayloadPtr = containerData + pos;
    return true;
}

bool Container::packToFile(const std::string& outputPath,
                           AlgorithmType algo,
                           const std::string& originalFilename,
                           uint64_t originalSize,
                           const std::vector<uint8_t>& originalSha256,
                           uint8_t validBitsInLastByte,
                           const std::vector<uint8_t>& metadata,
                           const std::vector<uint8_t>& payload) {
    std::vector<uint8_t> containerBytes;
    if (!pack(algo, originalFilename, originalSize, originalSha256, validBitsInLastByte, metadata, payload, containerBytes)) {
        return false;
    }
    std::ofstream out(outputPath, std::ios::binary);
    if (!out.is_open()) return false;
    out.write(reinterpret_cast<const char*>(containerBytes.data()), containerBytes.size());
    return out.good();
}

bool Container::readFromFile(const std::string& inputPath,
                             std::vector<uint8_t>& outContainerBytes) {
    std::ifstream in(inputPath, std::ios::binary | std::ios::ate);
    if (!in.is_open()) return false;
    std::streamsize size = in.tellg();
    if (size < 0) return false;
    in.seekg(0, std::ios::beg);
    outContainerBytes.resize(static_cast<size_t>(size));
    if (size > 0) {
        in.read(reinterpret_cast<char*>(outContainerBytes.data()), size);
    }
    return in.good() || size == 0;
}

} // namespace compressx

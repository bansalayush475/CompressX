#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace compressx {

enum class AlgorithmType : uint8_t {
    STORE = 0,
    HUFFMAN = 1,
    RLE = 2,
    AUTO = 255 // internal selection flag
};

inline const char* algorithmToString(AlgorithmType type) {
    switch (type) {
        case AlgorithmType::STORE: return "Store (Uncompressed)";
        case AlgorithmType::HUFFMAN: return "Huffman Coding";
        case AlgorithmType::RLE: return "Run-Length Encoding (RLE)";
        case AlgorithmType::AUTO: return "Automatic Mode";
        default: return "Unknown";
    }
}

struct ContainerHeader {
    uint32_t magic;                    // 'C' 'P' 'X' '1' -> 0x31585043
    uint16_t version;                  // Format version = 1
    uint8_t algorithm;                 // 0: Store, 1: Huffman, 2: RLE
    uint8_t flags;                     // Bits 0..3: valid bits in last byte (Huffman)
    uint64_t originalSize;             // Size of uncompressed data
    uint8_t originalSha256[32];        // SHA-256 hash of original file
    std::string originalFilename;      // Sanitized original filename
    std::vector<uint8_t> metadata;     // Algorithm-specific metadata (e.g. tree)
    uint64_t payloadSize;              // Length of compressed/stored payload
};

class Container {
public:
    static const uint32_t CPX_MAGIC = 0x31585043; // "CPX1"
    static const uint16_t CPX_VERSION = 1;

    static std::string sanitizeFilename(const std::string& rawName);

    static bool pack(AlgorithmType algo,
                     const std::string& originalFilename,
                     uint64_t originalSize,
                     const std::vector<uint8_t>& originalSha256,
                     uint8_t validBitsInLastByte,
                     const std::vector<uint8_t>& metadata,
                     const std::vector<uint8_t>& payload,
                     std::vector<uint8_t>& outContainer);

    static bool unpack(const uint8_t* containerData, size_t containerSize,
                       ContainerHeader& outHeader,
                       const uint8_t*& outPayloadPtr,
                       std::string& outErrorMessage);

    static bool packToFile(const std::string& outputPath,
                           AlgorithmType algo,
                           const std::string& originalFilename,
                           uint64_t originalSize,
                           const std::vector<uint8_t>& originalSha256,
                           uint8_t validBitsInLastByte,
                           const std::vector<uint8_t>& metadata,
                           const std::vector<uint8_t>& payload);

    static bool readFromFile(const std::string& inputPath,
                             std::vector<uint8_t>& outContainerBytes);
};

} // namespace compressx

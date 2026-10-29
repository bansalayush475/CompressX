#include "compressx_engine.hpp"
#include <chrono>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <cstring>
#include <cmath>

namespace compressx {

namespace {

std::string getFilenameFromPath(const std::string& path) {
    size_t pos = path.find_last_of("/\\");
    if (pos != std::string::npos) {
        return path.substr(pos + 1);
    }
    return path;
}

double calculateSpaceSavedPct(uint64_t origSize, uint64_t outSize) {
    if (origSize == 0) return 0.0;
    return (static_cast<double>(static_cast<int64_t>(origSize) - static_cast<int64_t>(outSize)) / static_cast<double>(origSize)) * 100.0;
}

double calculateRatio(uint64_t origSize, uint64_t outSize) {
    if (origSize == 0) return 1.0;
    if (outSize == 0) return 1.0;
    return static_cast<double>(origSize) / static_cast<double>(outSize);
}

} // anonymous namespace

CompressionResult CompressXEngine::compressFile(const std::string& inputPath,
                                               const std::string& outputPath,
                                               AlgorithmType algorithm,
                                               const std::string& userFilename) {
    CompressionResult res;
    res.outputPath = outputPath;

    std::string baseName = userFilename.empty() ? getFilenameFromPath(inputPath) : userFilename;

    std::ifstream in(inputPath, std::ios::binary | std::ios::ate);
    if (!in.is_open()) {
        res.errorMessage = "Failed to open input file: " + inputPath;
        return res;
    }
    std::streamsize fileSize = in.tellg();
    if (fileSize < 0) {
        res.errorMessage = "Failed to determine file size: " + inputPath;
        return res;
    }
    in.seekg(0, std::ios::beg);

    std::vector<uint8_t> inputData(static_cast<size_t>(fileSize));
    if (fileSize > 0) {
        in.read(reinterpret_cast<char*>(inputData.data()), fileSize);
        if (!in.good()) {
            res.errorMessage = "Failed to read input file bytes: " + inputPath;
            return res;
        }
    }
    in.close();

    res.originalSize = static_cast<uint64_t>(fileSize);

    // Compute original SHA-256
    SHA256 sha;
    sha.update(inputData.data(), inputData.size());
    std::vector<uint8_t> origHashBytes = sha.digest();
    res.originalSha256 = sha.hexDigest();

    auto startTime = std::chrono::high_resolution_clock::now();

    std::vector<uint8_t> chosenContainer;
    AlgorithmType chosenAlgo = algorithm;

    if (algorithm == AlgorithmType::AUTO) {
        // Automatic mode: evaluate all algorithms and select the smallest valid container
        std::vector<uint8_t> huffPayload, huffTree;
        uint8_t huffBits = 8;
        Huffman::compress(inputData.data(), inputData.size(), huffPayload, huffTree, huffBits);
        std::vector<uint8_t> huffContainer;
        Container::pack(AlgorithmType::HUFFMAN, baseName, res.originalSize, origHashBytes, huffBits, huffTree, huffPayload, huffContainer);

        std::vector<uint8_t> rlePayload;
        RLE::compress(inputData.data(), inputData.size(), rlePayload);
        std::vector<uint8_t> rleContainer;
        Container::pack(AlgorithmType::RLE, baseName, res.originalSize, origHashBytes, 8, {}, rlePayload, rleContainer);

        std::vector<uint8_t> storeContainer;
        Container::pack(AlgorithmType::STORE, baseName, res.originalSize, origHashBytes, 8, {}, inputData, storeContainer);

        // Compare container sizes
        size_t minSize = huffContainer.size();
        chosenAlgo = AlgorithmType::HUFFMAN;
        chosenContainer = std::move(huffContainer);

        if (rleContainer.size() < minSize) {
            minSize = rleContainer.size();
            chosenAlgo = AlgorithmType::RLE;
            chosenContainer = std::move(rleContainer);
        }

        if (storeContainer.size() < minSize) {
            minSize = storeContainer.size();
            chosenAlgo = AlgorithmType::STORE;
            chosenContainer = std::move(storeContainer);
        }
    } else if (algorithm == AlgorithmType::HUFFMAN) {
        std::vector<uint8_t> huffPayload, huffTree;
        uint8_t huffBits = 8;
        if (!Huffman::compress(inputData.data(), inputData.size(), huffPayload, huffTree, huffBits)) {
            res.errorMessage = "Huffman compression failed.";
            return res;
        }
        Container::pack(AlgorithmType::HUFFMAN, baseName, res.originalSize, origHashBytes, huffBits, huffTree, huffPayload, chosenContainer);
    } else if (algorithm == AlgorithmType::RLE) {
        std::vector<uint8_t> rlePayload;
        if (!RLE::compress(inputData.data(), inputData.size(), rlePayload)) {
            res.errorMessage = "RLE compression failed.";
            return res;
        }
        Container::pack(AlgorithmType::RLE, baseName, res.originalSize, origHashBytes, 8, {}, rlePayload, chosenContainer);
    } else { // STORE
        chosenAlgo = AlgorithmType::STORE;
        Container::pack(AlgorithmType::STORE, baseName, res.originalSize, origHashBytes, 8, {}, inputData, chosenContainer);
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.durationMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();

    // Write container to output
    std::ofstream out(outputPath, std::ios::binary);
    if (!out.is_open()) {
        res.errorMessage = "Failed to write compressed output file: " + outputPath;
        return res;
    }
    out.write(reinterpret_cast<const char*>(chosenContainer.data()), chosenContainer.size());
    if (!out.good()) {
        res.errorMessage = "Failed to finish writing output file: " + outputPath;
        return res;
    }
    out.close();

    res.selectedAlgorithm = chosenAlgo;
    res.algorithmName = algorithmToString(chosenAlgo);
    res.compressedSize = chosenContainer.size();
    res.spaceSaved = static_cast<int64_t>(res.originalSize) - static_cast<int64_t>(res.compressedSize);
    res.spaceSavedPercentage = calculateSpaceSavedPct(res.originalSize, res.compressedSize);
    res.compressionRatio = calculateRatio(res.originalSize, res.compressedSize);
    res.containerSha256 = SHA256::hashData(chosenContainer.data(), chosenContainer.size());
    res.success = true;
    return res;
}

DecompressionResult CompressXEngine::decompressFile(const std::string& cpxPath,
                                                   const std::string& outputPath) {
    DecompressionResult res;
    res.outputPath = outputPath;

    std::vector<uint8_t> containerBytes;
    if (!Container::readFromFile(cpxPath, containerBytes)) {
        res.errorMessage = "Failed to read compressed file: " + cpxPath;
        return res;
    }

    ContainerHeader header;
    const uint8_t* payloadPtr = nullptr;
    std::string unpackError;

    if (!Container::unpack(containerBytes.data(), containerBytes.size(), header, payloadPtr, unpackError)) {
        res.errorMessage = unpackError;
        return res;
    }

    res.algorithm = static_cast<AlgorithmType>(header.algorithm);
    res.algorithmName = algorithmToString(res.algorithm);
    res.originalFilename = header.originalFilename;

    auto startTime = std::chrono::high_resolution_clock::now();
    std::vector<uint8_t> recovered;

    if (res.algorithm == AlgorithmType::STORE) {
        if (header.payloadSize != header.originalSize) {
            res.errorMessage = "Corrupted store payload: size mismatch.";
            return res;
        }
        recovered.assign(payloadPtr, payloadPtr + header.payloadSize);
    } else if (res.algorithm == AlgorithmType::HUFFMAN) {
        uint8_t validBitsInLast = header.flags & 0x0F;
        if (!Huffman::decompress(payloadPtr, header.payloadSize,
                                 header.metadata.data(), header.metadata.size(),
                                 validBitsInLast, header.originalSize, recovered)) {
            res.errorMessage = "Corrupted Huffman payload or tree metadata.";
            return res;
        }
    } else if (res.algorithm == AlgorithmType::RLE) {
        if (!RLE::decompress(payloadPtr, header.payloadSize, header.originalSize, recovered)) {
            res.errorMessage = "Corrupted RLE payload.";
            return res;
        }
    } else {
        res.errorMessage = "Unknown compression algorithm in container header.";
        return res;
    }

    auto endTime = std::chrono::high_resolution_clock::now();
    res.durationMs = std::chrono::duration<double, std::milli>(endTime - startTime).count();

    // Verify recovered size
    if (recovered.size() != header.originalSize) {
        res.errorMessage = "Decompressed size (" + std::to_string(recovered.size()) +
                           ") does not match original size (" + std::to_string(header.originalSize) + ").";
        return res;
    }

    // Verify original SHA-256 hash
    SHA256 sha;
    sha.update(recovered.data(), recovered.size());
    std::vector<uint8_t> recHash = sha.digest();
    res.recoveredSha256 = sha.hexDigest();

    if (std::memcmp(recHash.data(), header.originalSha256, 32) != 0) {
        res.checksumVerified = false;
        res.errorMessage = "Checksum mismatch: Recovered data does not match original SHA-256.";
        return res;
    }
    res.checksumVerified = true;

    // Write recovered file
    std::ofstream out(outputPath, std::ios::binary);
    if (!out.is_open()) {
        res.errorMessage = "Failed to open destination file for writing: " + outputPath;
        return res;
    }
    if (!recovered.empty()) {
        out.write(reinterpret_cast<const char*>(recovered.data()), recovered.size());
        if (!out.good()) {
            res.errorMessage = "Failed while writing recovered file: " + outputPath;
            return res;
        }
    }
    out.close();

    res.recoveredSize = recovered.size();
    res.success = true;
    return res;
}

ComparisonReport CompressXEngine::compareAlgorithms(const std::string& inputPath) {
    ComparisonReport rep;
    rep.filename = getFilenameFromPath(inputPath);

    std::ifstream in(inputPath, std::ios::binary | std::ios::ate);
    if (!in.is_open()) {
        rep.errorMessage = "Failed to open input file for comparison: " + inputPath;
        return rep;
    }
    std::streamsize fileSize = in.tellg();
    if (fileSize < 0) {
        rep.errorMessage = "Invalid input file size.";
        return rep;
    }
    in.seekg(0, std::ios::beg);

    std::vector<uint8_t> inputData(static_cast<size_t>(fileSize));
    if (fileSize > 0) {
        in.read(reinterpret_cast<char*>(inputData.data()), fileSize);
    }
    in.close();

    rep.originalSize = static_cast<uint64_t>(fileSize);
    SHA256 sha;
    sha.update(inputData.data(), inputData.size());
    std::vector<uint8_t> origHashBytes = sha.digest();
    rep.originalSha256 = sha.hexDigest();

    // 1. Store
    {
        AlgorithmComparisonItem item;
        item.algorithmKey = "STORE";
        item.algorithmName = "Store Without Compression";
        item.inputSize = rep.originalSize;

        auto t0 = std::chrono::high_resolution_clock::now();
        std::vector<uint8_t> container;
        Container::pack(AlgorithmType::STORE, rep.filename, rep.originalSize, origHashBytes, 8, {}, inputData, container);
        auto t1 = std::chrono::high_resolution_clock::now();
        item.compressionTimeMs = std::chrono::duration<double, std::milli>(t1 - t0).count();
        item.outputSize = container.size();
        item.spaceSaved = static_cast<int64_t>(item.inputSize) - static_cast<int64_t>(item.outputSize);
        item.spaceSavedPercentage = calculateSpaceSavedPct(item.inputSize, item.outputSize);
        item.compressionRatio = calculateRatio(item.inputSize, item.outputSize);

        // Decompress & verify
        auto t2 = std::chrono::high_resolution_clock::now();
        ContainerHeader hdr;
        const uint8_t* payloadPtr = nullptr;
        std::string err;
        if (Container::unpack(container.data(), container.size(), hdr, payloadPtr, err)) {
            std::vector<uint8_t> rec(payloadPtr, payloadPtr + hdr.payloadSize);
            auto t3 = std::chrono::high_resolution_clock::now();
            item.decompressionTimeMs = std::chrono::duration<double, std::milli>(t3 - t2).count();
            item.verified = (rec == inputData);
        }
        rep.items.push_back(item);
    }

    // 2. Huffman
    {
        AlgorithmComparisonItem item;
        item.algorithmKey = "HUFFMAN";
        item.algorithmName = "Huffman Coding";
        item.inputSize = rep.originalSize;

        auto t0 = std::chrono::high_resolution_clock::now();
        std::vector<uint8_t> payload, treeMeta;
        uint8_t validBits = 8;
        Huffman::compress(inputData.data(), inputData.size(), payload, treeMeta, validBits);
        std::vector<uint8_t> container;
        Container::pack(AlgorithmType::HUFFMAN, rep.filename, rep.originalSize, origHashBytes, validBits, treeMeta, payload, container);
        auto t1 = std::chrono::high_resolution_clock::now();
        item.compressionTimeMs = std::chrono::duration<double, std::milli>(t1 - t0).count();
        item.outputSize = container.size();
        item.spaceSaved = static_cast<int64_t>(item.inputSize) - static_cast<int64_t>(item.outputSize);
        item.spaceSavedPercentage = calculateSpaceSavedPct(item.inputSize, item.outputSize);
        item.compressionRatio = calculateRatio(item.inputSize, item.outputSize);

        // Decompress & verify
        auto t2 = std::chrono::high_resolution_clock::now();
        ContainerHeader hdr;
        const uint8_t* payloadPtr = nullptr;
        std::string err;
        if (Container::unpack(container.data(), container.size(), hdr, payloadPtr, err)) {
            std::vector<uint8_t> rec;
            uint8_t vBits = hdr.flags & 0x0F;
            bool ok = Huffman::decompress(payloadPtr, hdr.payloadSize, hdr.metadata.data(), hdr.metadata.size(), vBits, hdr.originalSize, rec);
            auto t3 = std::chrono::high_resolution_clock::now();
            item.decompressionTimeMs = std::chrono::duration<double, std::milli>(t3 - t2).count();
            item.verified = (ok && rec == inputData);
        }
        rep.items.push_back(item);
    }

    // 3. RLE
    {
        AlgorithmComparisonItem item;
        item.algorithmKey = "RLE";
        item.algorithmName = "Run-Length Encoding (RLE)";
        item.inputSize = rep.originalSize;

        auto t0 = std::chrono::high_resolution_clock::now();
        std::vector<uint8_t> payload;
        RLE::compress(inputData.data(), inputData.size(), payload);
        std::vector<uint8_t> container;
        Container::pack(AlgorithmType::RLE, rep.filename, rep.originalSize, origHashBytes, 8, {}, payload, container);
        auto t1 = std::chrono::high_resolution_clock::now();
        item.compressionTimeMs = std::chrono::duration<double, std::milli>(t1 - t0).count();
        item.outputSize = container.size();
        item.spaceSaved = static_cast<int64_t>(item.inputSize) - static_cast<int64_t>(item.outputSize);
        item.spaceSavedPercentage = calculateSpaceSavedPct(item.inputSize, item.outputSize);
        item.compressionRatio = calculateRatio(item.inputSize, item.outputSize);

        // Decompress & verify
        auto t2 = std::chrono::high_resolution_clock::now();
        ContainerHeader hdr;
        const uint8_t* payloadPtr = nullptr;
        std::string err;
        if (Container::unpack(container.data(), container.size(), hdr, payloadPtr, err)) {
            std::vector<uint8_t> rec;
            bool ok = RLE::decompress(payloadPtr, hdr.payloadSize, hdr.originalSize, rec);
            auto t3 = std::chrono::high_resolution_clock::now();
            item.decompressionTimeMs = std::chrono::duration<double, std::milli>(t3 - t2).count();
            item.verified = (ok && rec == inputData);
        }
        rep.items.push_back(item);
    }

    // Find best algorithm among tested
    size_t minOutput = rep.items[0].outputSize;
    size_t bestIdx = 0;
    // Tie-break priority: Huffman (idx 1), RLE (idx 2), Store (idx 0)
    for (size_t i = 1; i < rep.items.size(); ++i) {
        if (rep.items[i].outputSize < minOutput) {
            minOutput = rep.items[i].outputSize;
            bestIdx = i;
        }
    }
    rep.items[bestIdx].selectedInAuto = true;
    rep.bestAlgorithm = rep.items[bestIdx].algorithmName;

    // 4. Auto Mode Summary Item
    AlgorithmComparisonItem autoItem;
    autoItem.algorithmKey = "AUTO";
    autoItem.algorithmName = "Automatic Mode (" + rep.bestAlgorithm + ")";
    autoItem.inputSize = rep.originalSize;
    autoItem.outputSize = rep.items[bestIdx].outputSize;
    autoItem.spaceSaved = rep.items[bestIdx].spaceSaved;
    autoItem.spaceSavedPercentage = rep.items[bestIdx].spaceSavedPercentage;
    autoItem.compressionRatio = rep.items[bestIdx].compressionRatio;
    autoItem.compressionTimeMs = rep.items[0].compressionTimeMs + rep.items[1].compressionTimeMs + rep.items[2].compressionTimeMs;
    autoItem.decompressionTimeMs = rep.items[bestIdx].decompressionTimeMs;
    autoItem.verified = rep.items[bestIdx].verified;
    autoItem.selectedInAuto = true;
    rep.items.push_back(autoItem);

    rep.success = true;
    return rep;
}

std::string CompressXEngine::generateVisualizerJson(const std::string& inputPath,
                                                   const std::string& rawText) {
    std::vector<uint8_t> data;
    if (!rawText.empty()) {
        data.assign(rawText.begin(), rawText.end());
    } else {
        std::ifstream in(inputPath, std::ios::binary | std::ios::ate);
        if (!in.is_open()) return "{\"error\":\"File not found\"}";
        std::streamsize s = in.tellg();
        if (s > 0) {
            in.seekg(0, std::ios::beg);
            // Limit visualizer sample to 50KB to keep UI responsive and clean
            size_t sampleSize = std::min(static_cast<size_t>(s), static_cast<size_t>(51200));
            data.resize(sampleSize);
            in.read(reinterpret_cast<char*>(data.data()), sampleSize);
        }
    }

    HuffmanVisualizerTrace trace = Huffman::generateTrace(data.data(), data.size());

    std::ostringstream json;
    json << "{";
    json << "\"totalBytes\":" << trace.totalBytes << ",";
    json << "\"uniqueSymbols\":" << trace.uniqueSymbols << ",";
    json << "\"entropy\":" << std::fixed << std::setprecision(4) << trace.entropy << ",";
    json << "\"avgCodeLength\":" << std::fixed << std::setprecision(4) << trace.avgCodeLength << ",";

    // Symbols array
    json << "\"symbols\":[";
    for (size_t i = 0; i < trace.symbols.size(); ++i) {
        const auto& s = trace.symbols[i];
        if (i > 0) json << ",";
        json << "{";
        json << "\"byteVal\":" << static_cast<int>(s.byteVal) << ",";
        json << "\"label\":\"" << s.label << "\",";
        json << "\"hex\":\"" << s.hex << "\",";
        json << "\"freq\":" << s.freq << ",";
        json << "\"percentage\":" << std::fixed << std::setprecision(2) << s.percentage << ",";
        json << "\"code\":\"" << s.code << "\",";
        json << "\"codeLength\":" << s.codeLength;
        json << "}";
    }
    json << "],";

    // Steps array
    json << "\"steps\":[";
    for (size_t i = 0; i < trace.steps.size(); ++i) {
        const auto& st = trace.steps[i];
        if (i > 0) json << ",";
        json << "{";
        json << "\"type\":\"" << st.type << "\",";
        json << "\"description\":\"" << st.description << "\",";
        json << "\"createdNodeId\":" << st.createdNodeId << ",";
        json << "\"activeNodeIds\":[";
        for (size_t a = 0; a < st.activeNodeIds.size(); ++a) {
            if (a > 0) json << ",";
            json << st.activeNodeIds[a];
        }
        json << "],";
        json << "\"heapNodeIds\":[";
        for (size_t h = 0; h < st.heapNodeIds.size(); ++h) {
            if (h > 0) json << ",";
            json << st.heapNodeIds[h];
        }
        json << "]";
        json << "}";
    }
    json << "],";

    // Tree hierarchy
    json << "\"tree\":" << (trace.treeJson.empty() ? "null" : trace.treeJson);
    json << "}";
    return json.str();
}

} // namespace compressx

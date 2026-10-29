#pragma once

#include "container.hpp"
#include "huffman.hpp"
#include "rle.hpp"
#include "sha256.hpp"
#include <string>
#include <vector>

namespace compressx {

struct CompressionResult {
    bool success = false;
    std::string errorMessage;
    AlgorithmType selectedAlgorithm = AlgorithmType::STORE;
    std::string algorithmName;
    uint64_t originalSize = 0;
    uint64_t compressedSize = 0;
    int64_t spaceSaved = 0;
    double spaceSavedPercentage = 0.0;
    double compressionRatio = 1.0;
    double durationMs = 0.0;
    std::string originalSha256;
    std::string containerSha256;
    std::string outputPath;
};

struct DecompressionResult {
    bool success = false;
    std::string errorMessage;
    AlgorithmType algorithm = AlgorithmType::STORE;
    std::string algorithmName;
    std::string originalFilename;
    uint64_t recoveredSize = 0;
    double durationMs = 0.0;
    std::string recoveredSha256;
    bool checksumVerified = false;
    std::string outputPath;
};

struct AlgorithmComparisonItem {
    std::string algorithmKey;
    std::string algorithmName;
    uint64_t inputSize = 0;
    uint64_t outputSize = 0;
    int64_t spaceSaved = 0;
    double spaceSavedPercentage = 0.0;
    double compressionRatio = 1.0;
    double compressionTimeMs = 0.0;
    double decompressionTimeMs = 0.0;
    bool verified = false;
    bool selectedInAuto = false;
};

struct ComparisonReport {
    bool success = false;
    std::string errorMessage;
    std::string filename;
    uint64_t originalSize = 0;
    std::string originalSha256;
    std::vector<AlgorithmComparisonItem> items;
    std::string bestAlgorithm;
};

class CompressXEngine {
public:
    static CompressionResult compressFile(const std::string& inputPath,
                                         const std::string& outputPath,
                                         AlgorithmType algorithm,
                                         const std::string& userFilename = "");

    static DecompressionResult decompressFile(const std::string& cpxPath,
                                             const std::string& outputPath);

    static ComparisonReport compareAlgorithms(const std::string& inputPath);

    static std::string generateVisualizerJson(const std::string& inputPath,
                                             const std::string& rawText = "");
};

} // namespace compressx

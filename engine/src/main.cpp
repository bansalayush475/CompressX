#include "compressx_engine.hpp"
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <iomanip>

using namespace compressx;

static std::string escapeJsonStr(const std::string& s) {
    std::string out;
    for (char c : s) {
        if (c == '\\') out += "\\\\";
        else if (c == '"') out += "\\\"";
        else if (c == '\n') out += "\\n";
        else if (c == '\r') out += "\\r";
        else if (c == '\t') out += "\\t";
        else out += c;
    }
    return out;
}

void printUsage() {
    std::cout << "CompressX Engine v1.0.0\n"
              << "Usage:\n"
              << "  compressx compress --input <file> --output <file> [--algo <auto|huffman|rle|store>] [--filename <name>]\n"
              << "  compressx decompress --input <file> --output <file>\n"
              << "  compressx compare --input <file>\n"
              << "  compressx visualize [--input <file> | --text <text>]\n"
              << "  compressx info --input <file>\n";
}

int main(int argc, char* argv[]) {
    if (argc < 2) {
        printUsage();
        return 1;
    }

    std::string command = argv[1];
    std::string inputPath;
    std::string outputPath;
    std::string algoStr = "auto";
    std::string userFilename;
    std::string rawText;

    for (int i = 2; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--input" && i + 1 < argc) {
            inputPath = argv[++i];
        } else if (arg == "--output" && i + 1 < argc) {
            outputPath = argv[++i];
        } else if (arg == "--algo" && i + 1 < argc) {
            algoStr = argv[++i];
        } else if (arg == "--filename" && i + 1 < argc) {
            userFilename = argv[++i];
        } else if (arg == "--text" && i + 1 < argc) {
            rawText = argv[++i];
        }
    }

    if (command == "compress") {
        if (inputPath.empty() || outputPath.empty()) {
            std::cerr << "{\"error\":\"Missing required arguments: --input and --output\"}\n";
            return 1;
        }

        AlgorithmType algo = AlgorithmType::AUTO;
        if (algoStr == "huffman") algo = AlgorithmType::HUFFMAN;
        else if (algoStr == "rle") algo = AlgorithmType::RLE;
        else if (algoStr == "store") algo = AlgorithmType::STORE;
        else if (algoStr == "auto") algo = AlgorithmType::AUTO;

        CompressionResult res = CompressXEngine::compressFile(inputPath, outputPath, algo, userFilename);

        std::cout << "{\n"
                  << "  \"success\": " << (res.success ? "true" : "false") << ",\n"
                  << "  \"errorMessage\": \"" << escapeJsonStr(res.errorMessage) << "\",\n"
                  << "  \"algorithm\": \"" << escapeJsonStr(res.algorithmName) << "\",\n"
                  << "  \"algorithmCode\": " << static_cast<int>(res.selectedAlgorithm) << ",\n"
                  << "  \"originalSize\": " << res.originalSize << ",\n"
                  << "  \"compressedSize\": " << res.compressedSize << ",\n"
                  << "  \"spaceSaved\": " << res.spaceSaved << ",\n"
                  << "  \"spaceSavedPercentage\": " << std::fixed << std::setprecision(2) << res.spaceSavedPercentage << ",\n"
                  << "  \"compressionRatio\": " << std::fixed << std::setprecision(4) << res.compressionRatio << ",\n"
                  << "  \"durationMs\": " << std::fixed << std::setprecision(3) << res.durationMs << ",\n"
                  << "  \"originalSha256\": \"" << escapeJsonStr(res.originalSha256) << "\",\n"
                  << "  \"containerSha256\": \"" << escapeJsonStr(res.containerSha256) << "\",\n"
                  << "  \"outputPath\": \"" << escapeJsonStr(res.outputPath) << "\"\n"
                  << "}\n";

        return res.success ? 0 : 2;

    } else if (command == "decompress") {
        if (inputPath.empty() || outputPath.empty()) {
            std::cerr << "{\"error\":\"Missing required arguments: --input and --output\"}\n";
            return 1;
        }

        DecompressionResult res = CompressXEngine::decompressFile(inputPath, outputPath);

        std::cout << "{\n"
                  << "  \"success\": " << (res.success ? "true" : "false") << ",\n"
                  << "  \"errorMessage\": \"" << escapeJsonStr(res.errorMessage) << "\",\n"
                  << "  \"algorithm\": \"" << escapeJsonStr(res.algorithmName) << "\",\n"
                  << "  \"originalFilename\": \"" << escapeJsonStr(res.originalFilename) << "\",\n"
                  << "  \"recoveredSize\": " << res.recoveredSize << ",\n"
                  << "  \"durationMs\": " << std::fixed << std::setprecision(3) << res.durationMs << ",\n"
                  << "  \"recoveredSha256\": \"" << escapeJsonStr(res.recoveredSha256) << "\",\n"
                  << "  \"checksumVerified\": " << (res.checksumVerified ? "true" : "false") << ",\n"
                  << "  \"outputPath\": \"" << escapeJsonStr(res.outputPath) << "\"\n"
                  << "}\n";

        return res.success ? 0 : 2;

    } else if (command == "compare") {
        if (inputPath.empty()) {
            std::cerr << "{\"error\":\"Missing required argument: --input\"}\n";
            return 1;
        }

        ComparisonReport rep = CompressXEngine::compareAlgorithms(inputPath);
        if (!rep.success) {
            std::cout << "{\"success\":false,\"errorMessage\":\"" << rep.errorMessage << "\"}\n";
            return 2;
        }

        std::cout << "{\n"
                  << "  \"success\": true,\n"
                  << "  \"filename\": \"" << escapeJsonStr(rep.filename) << "\",\n"
                  << "  \"originalSize\": " << rep.originalSize << ",\n"
                  << "  \"originalSha256\": \"" << escapeJsonStr(rep.originalSha256) << "\",\n"
                  << "  \"bestAlgorithm\": \"" << escapeJsonStr(rep.bestAlgorithm) << "\",\n"
                  << "  \"items\": [\n";

        for (size_t i = 0; i < rep.items.size(); ++i) {
            const auto& item = rep.items[i];
            if (i > 0) std::cout << ",\n";
            std::cout << "    {\n"
                      << "      \"algorithmKey\": \"" << escapeJsonStr(item.algorithmKey) << "\",\n"
                      << "      \"algorithmName\": \"" << escapeJsonStr(item.algorithmName) << "\",\n"
                      << "      \"inputSize\": " << item.inputSize << ",\n"
                      << "      \"outputSize\": " << item.outputSize << ",\n"
                      << "      \"spaceSaved\": " << item.spaceSaved << ",\n"
                      << "      \"spaceSavedPercentage\": " << std::fixed << std::setprecision(2) << item.spaceSavedPercentage << ",\n"
                      << "      \"compressionRatio\": " << std::fixed << std::setprecision(4) << item.compressionRatio << ",\n"
                      << "      \"compressionTimeMs\": " << std::fixed << std::setprecision(3) << item.compressionTimeMs << ",\n"
                      << "      \"decompressionTimeMs\": " << std::fixed << std::setprecision(3) << item.decompressionTimeMs << ",\n"
                      << "      \"verified\": " << (item.verified ? "true" : "false") << ",\n"
                      << "      \"selectedInAuto\": " << (item.selectedInAuto ? "true" : "false") << "\n"
                      << "    }";
        }
        std::cout << "\n  ]\n}\n";
        return 0;

    } else if (command == "visualize") {
        std::string json = CompressXEngine::generateVisualizerJson(inputPath, rawText);
        std::cout << json << "\n";
        return 0;

    } else if (command == "info") {
        if (inputPath.empty()) {
            std::cerr << "{\"error\":\"Missing required argument: --input\"}\n";
            return 1;
        }

        std::vector<uint8_t> data;
        if (!Container::readFromFile(inputPath, data)) {
            std::cout << "{\"success\":false,\"errorMessage\":\"Failed to read file.\"}\n";
            return 2;
        }

        ContainerHeader hdr;
        const uint8_t* p = nullptr;
        std::string err;
        if (!Container::unpack(data.data(), data.size(), hdr, p, err)) {
            std::cout << "{\"success\":false,\"errorMessage\":\"" << err << "\"}\n";
            return 2;
        }

        std::ostringstream shaHex;
        for (int i = 0; i < 32; ++i) {
            shaHex << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(hdr.originalSha256[i]);
        }

        std::cout << "{\n"
                  << "  \"success\": true,\n"
                  << "  \"magic\": \"CPX1\",\n"
                  << "  \"version\": " << hdr.version << ",\n"
                  << "  \"algorithm\": \"" << algorithmToString(static_cast<AlgorithmType>(hdr.algorithm)) << "\",\n"
                  << "  \"algorithmCode\": " << static_cast<int>(hdr.algorithm) << ",\n"
                  << "  \"originalFilename\": \"" << hdr.originalFilename << "\",\n"
                  << "  \"originalSize\": " << hdr.originalSize << ",\n"
                  << "  \"payloadSize\": " << hdr.payloadSize << ",\n"
                  << "  \"originalSha256\": \"" << shaHex.str() << "\"\n"
                  << "}\n";
        return 0;
    }

    printUsage();
    return 1;
}

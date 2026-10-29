#pragma once

#include <cstdint>
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>
#include <queue>

namespace compressx {

struct HuffmanNode {
    int id;
    uint8_t byteVal;
    uint64_t freq;
    bool isLeaf;
    std::shared_ptr<HuffmanNode> left;
    std::shared_ptr<HuffmanNode> right;

    HuffmanNode(int id, uint8_t val, uint64_t f)
        : id(id), byteVal(val), freq(f), isLeaf(true), left(nullptr), right(nullptr) {}

    HuffmanNode(int id, uint64_t f, std::shared_ptr<HuffmanNode> l, std::shared_ptr<HuffmanNode> r)
        : id(id), byteVal(0), freq(f), isLeaf(false), left(l), right(r) {}
};

struct CompareNode {
    bool operator()(const std::shared_ptr<HuffmanNode>& a, const std::shared_ptr<HuffmanNode>& b) const {
        if (a->freq != b->freq) {
            return a->freq > b->freq; // min-heap: lowest frequency first
        }
        return a->id > b->id; // deterministic tie-breaker
    }
};

class BitWriter {
public:
    BitWriter() : currentByte(0), bitCount(0) {}

    void writeBit(int bit) {
        if (bit) {
            currentByte |= (1 << (7 - bitCount));
        }
        bitCount++;
        if (bitCount == 8) {
            buffer.push_back(currentByte);
            currentByte = 0;
            bitCount = 0;
        }
    }

    void writeBits(uint32_t val, int count) {
        for (int i = count - 1; i >= 0; --i) {
            writeBit((val >> i) & 1);
        }
    }

    void writeByte(uint8_t byte) {
        for (int i = 7; i >= 0; --i) {
            writeBit((byte >> i) & 1);
        }
    }

    void flush() {
        if (bitCount > 0) {
            buffer.push_back(currentByte);
            validBitsInLastByte = bitCount;
            bitCount = 0;
            currentByte = 0;
        } else {
            validBitsInLastByte = 8;
        }
    }

    const std::vector<uint8_t>& getBuffer() const { return buffer; }
    uint8_t getValidBitsInLastByte() const { return validBitsInLastByte; }

private:
    std::vector<uint8_t> buffer;
    uint8_t currentByte;
    int bitCount;
    uint8_t validBitsInLastByte = 8;
};

class BitReader {
public:
    BitReader(const uint8_t* data, size_t length, uint8_t validBitsInLastByte = 8)
        : data(data), length(length), byteIdx(0), bitIdx(0), validBitsInLast(validBitsInLastByte) {}

    bool readBit(int& outBit) {
        if (byteIdx >= length) return false;
        if (byteIdx == length - 1 && bitIdx >= validBitsInLast) return false;

        outBit = (data[byteIdx] >> (7 - bitIdx)) & 1;
        bitIdx++;
        if (bitIdx == 8) {
            bitIdx = 0;
            byteIdx++;
        }
        return true;
    }

    bool readByte(uint8_t& outByte) {
        outByte = 0;
        for (int i = 7; i >= 0; --i) {
            int bit = 0;
            if (!readBit(bit)) return false;
            if (bit) outByte |= (1 << i);
        }
        return true;
    }

    bool hasMore() const {
        if (byteIdx >= length) return false;
        if (byteIdx == length - 1 && bitIdx >= validBitsInLast) return false;
        return true;
    }

private:
    const uint8_t* data;
    size_t length;
    size_t byteIdx;
    int bitIdx;
    uint8_t validBitsInLast;
};

struct HuffmanCode {
    uint8_t symbol;
    std::string bitString;
    uint32_t bitPattern;
    int length;
};

struct VisualizerTraceStep {
    std::string type; // "INIT", "EXTRACT", "MERGE", "COMPLETE"
    std::string description;
    std::vector<int> heapNodeIds;
    std::vector<int> activeNodeIds;
    int createdNodeId = -1;
};

struct HuffmanVisualizerTrace {
    struct SymbolInfo {
        uint8_t byteVal;
        std::string label;
        std::string hex;
        uint64_t freq;
        double percentage;
        std::string code;
        int codeLength;
    };

    uint64_t totalBytes = 0;
    int uniqueSymbols = 0;
    double entropy = 0.0;
    double avgCodeLength = 0.0;
    std::vector<SymbolInfo> symbols;
    std::vector<VisualizerTraceStep> steps;
    std::string treeJson;
};

class Huffman {
public:
    static bool compress(const uint8_t* input, size_t inputLen,
                         std::vector<uint8_t>& outPayload,
                         std::vector<uint8_t>& outTreeMetadata,
                         uint8_t& outValidBitsInLastByte);

    static bool decompress(const uint8_t* payload, size_t payloadLen,
                           const uint8_t* treeMetadata, size_t treeMetaLen,
                           uint8_t validBitsInLastByte,
                           uint64_t expectedOriginalSize,
                           std::vector<uint8_t>& outRecovered);

    static HuffmanVisualizerTrace generateTrace(const uint8_t* input, size_t inputLen);

private:
    static void serializeTree(const std::shared_ptr<HuffmanNode>& node, BitWriter& writer);
    static std::shared_ptr<HuffmanNode> deserializeTree(BitReader& reader, int& nextId);
    static void generateCodes(const std::shared_ptr<HuffmanNode>& node,
                              const std::string& currentCode,
                              std::unordered_map<uint8_t, HuffmanCode>& codeMap);
};

} // namespace compressx

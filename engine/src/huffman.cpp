#include "huffman.hpp"
#include <cmath>
#include <iomanip>
#include <sstream>
#include <algorithm>

namespace compressx {

namespace {

std::string getByteDisplayLabel(uint8_t b) {
    if (b >= 32 && b <= 126 && b != '"' && b != '\\') {
        return std::string("'") + static_cast<char>(b) + "'";
    }
    std::ostringstream oss;
    switch (b) {
        case '\n': return "'\\n' (0x0A)";
        case '\r': return "'\\r' (0x0D)";
        case '\t': return "'\\t' (0x09)";
        case ' ': return "'Space' (0x20)";
        case 0: return "'NUL' (0x00)";
        default:
            oss << "0x" << std::uppercase << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(b);
            return oss.str();
    }
}

std::string getByteHex(uint8_t b) {
    std::ostringstream oss;
    oss << "0x" << std::uppercase << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(b);
    return oss.str();
}

std::string escapeJson(const std::string& s) {
    std::ostringstream o;
    for (char c : s) {
        if (c == '"') o << "\\\"";
        else if (c == '\\') o << "\\\\";
        else if (c == '\b') o << "\\b";
        else if (c == '\f') o << "\\f";
        else if (c == '\n') o << "\\n";
        else if (c == '\r') o << "\\r";
        else if (c == '\t') o << "\\t";
        else if (static_cast<unsigned char>(c) < 32) {
            o << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(c);
        } else {
            o << c;
        }
    }
    return o.str();
}

void treeToJson(const std::shared_ptr<HuffmanNode>& node, const std::string& code, std::ostringstream& oss) {
    if (!node) {
        oss << "null";
        return;
    }
    oss << "{";
    oss << "\"id\":" << node->id << ",";
    oss << "\"freq\":" << node->freq << ",";
    oss << "\"isLeaf\":" << (node->isLeaf ? "true" : "false") << ",";
    oss << "\"code\":\"" << code << "\",";
    if (node->isLeaf) {
        oss << "\"byteVal\":" << static_cast<int>(node->byteVal) << ",";
        oss << "\"hex\":\"" << getByteHex(node->byteVal) << "\",";
        oss << "\"label\":\"" << escapeJson(getByteDisplayLabel(node->byteVal)) << "\"";
    } else {
        oss << "\"label\":\"Parent (" << node->freq << ")\",";
        oss << "\"left\":";
        treeToJson(node->left, code + "0", oss);
        oss << ",\"right\":";
        treeToJson(node->right, code + "1", oss);
    }
    oss << "}";
}

} // anonymous namespace

void Huffman::serializeTree(const std::shared_ptr<HuffmanNode>& node, BitWriter& writer) {
    if (!node) return;
    if (node->isLeaf) {
        writer.writeBit(1);
        writer.writeByte(node->byteVal);
    } else {
        writer.writeBit(0);
        serializeTree(node->left, writer);
        serializeTree(node->right, writer);
    }
}

std::shared_ptr<HuffmanNode> Huffman::deserializeTree(BitReader& reader, int& nextId) {
    int bit = 0;
    if (!reader.readBit(bit)) {
        return nullptr;
    }
    if (bit == 1) {
        uint8_t val = 0;
        if (!reader.readByte(val)) return nullptr;
        return std::make_shared<HuffmanNode>(nextId++, val, 0);
    } else {
        int id = nextId++;
        auto left = deserializeTree(reader, nextId);
        auto right = deserializeTree(reader, nextId);
        if (!left || !right) return nullptr;
        return std::make_shared<HuffmanNode>(id, 0, left, right);
    }
}

void Huffman::generateCodes(const std::shared_ptr<HuffmanNode>& node,
                            const std::string& currentCode,
                            std::unordered_map<uint8_t, HuffmanCode>& codeMap) {
    if (!node) return;
    if (node->isLeaf) {
        HuffmanCode hc;
        hc.symbol = node->byteVal;
        hc.bitString = currentCode.empty() ? "0" : currentCode;
        hc.length = static_cast<int>(hc.bitString.size());
        uint32_t pat = 0;
        for (char c : hc.bitString) {
            pat = (pat << 1) | (c == '1' ? 1 : 0);
        }
        hc.bitPattern = pat;
        codeMap[node->byteVal] = hc;
        return;
    }
    generateCodes(node->left, currentCode + "0", codeMap);
    generateCodes(node->right, currentCode + "1", codeMap);
}

bool Huffman::compress(const uint8_t* input, size_t inputLen,
                      std::vector<uint8_t>& outPayload,
                      std::vector<uint8_t>& outTreeMetadata,
                      uint8_t& outValidBitsInLastByte) {
    outPayload.clear();
    outTreeMetadata.clear();
    outValidBitsInLastByte = 8;

    if (inputLen == 0) {
        return true;
    }

    uint64_t freq[256] = {0};
    for (size_t i = 0; i < inputLen; ++i) {
        freq[input[i]]++;
    }

    std::priority_queue<std::shared_ptr<HuffmanNode>,
                        std::vector<std::shared_ptr<HuffmanNode>>,
                        CompareNode> pq;

    int nextId = 0;
    for (int i = 0; i < 256; ++i) {
        if (freq[i] > 0) {
            pq.push(std::make_shared<HuffmanNode>(nextId++, static_cast<uint8_t>(i), freq[i]));
        }
    }

    if (pq.empty()) {
        return true;
    }

    std::shared_ptr<HuffmanNode> root;
    if (pq.size() == 1) {
        root = pq.top();
        pq.pop();
    } else {
        while (pq.size() > 1) {
            auto left = pq.top(); pq.pop();
            auto right = pq.top(); pq.pop();
            auto parent = std::make_shared<HuffmanNode>(nextId++, left->freq + right->freq, left, right);
            pq.push(parent);
        }
        root = pq.top();
        pq.pop();
    }

    BitWriter treeWriter;
    serializeTree(root, treeWriter);
    treeWriter.flush();
    outTreeMetadata = treeWriter.getBuffer();

    std::unordered_map<uint8_t, HuffmanCode> codeMap;
    generateCodes(root, "", codeMap);

    BitWriter payloadWriter;
    for (size_t i = 0; i < inputLen; ++i) {
        const auto& code = codeMap[input[i]];
        for (char c : code.bitString) {
            payloadWriter.writeBit(c == '1' ? 1 : 0);
        }
    }
    payloadWriter.flush();

    outPayload = payloadWriter.getBuffer();
    outValidBitsInLastByte = payloadWriter.getValidBitsInLastByte();
    return true;
}

bool Huffman::decompress(const uint8_t* payload, size_t payloadLen,
                         const uint8_t* treeMetadata, size_t treeMetaLen,
                         uint8_t validBitsInLastByte,
                         uint64_t expectedOriginalSize,
                         std::vector<uint8_t>& outRecovered) {
    outRecovered.clear();

    if (expectedOriginalSize == 0) {
        return true;
    }

    if (!treeMetadata || treeMetaLen == 0) {
        return false;
    }

    BitReader treeReader(treeMetadata, treeMetaLen, 8);
    int nextId = 0;
    auto root = deserializeTree(treeReader, nextId);
    if (!root) {
        return false;
    }

    outRecovered.reserve(expectedOriginalSize);

    if (root->isLeaf) {
        outRecovered.assign(expectedOriginalSize, root->byteVal);
        return true;
    }

    if (!payload || payloadLen == 0) {
        return false;
    }

    BitReader payloadReader(payload, payloadLen, validBitsInLastByte);
    auto curr = root;

    while (outRecovered.size() < expectedOriginalSize) {
        int bit = 0;
        if (!payloadReader.readBit(bit)) {
            break;
        }
        curr = (bit == 0) ? curr->left : curr->right;
        if (!curr) {
            return false;
        }
        if (curr->isLeaf) {
            outRecovered.push_back(curr->byteVal);
            curr = root;
        }
    }

    return (outRecovered.size() == expectedOriginalSize);
}

HuffmanVisualizerTrace Huffman::generateTrace(const uint8_t* input, size_t inputLen) {
    HuffmanVisualizerTrace trace;
    trace.totalBytes = inputLen;

    if (inputLen == 0) {
        return trace;
    }

    uint64_t freq[256] = {0};
    for (size_t i = 0; i < inputLen; ++i) {
        freq[input[i]]++;
    }

    std::vector<std::shared_ptr<HuffmanNode>> nodes;
    int nextId = 0;
    for (int i = 0; i < 256; ++i) {
        if (freq[i] > 0) {
            nodes.push_back(std::make_shared<HuffmanNode>(nextId++, static_cast<uint8_t>(i), freq[i]));
        }
    }

    trace.uniqueSymbols = static_cast<int>(nodes.size());

    // Calculate entropy: H = -sum(p_i * log2(p_i))
    double entropy = 0.0;
    for (const auto& node : nodes) {
        double p = static_cast<double>(node->freq) / static_cast<double>(inputLen);
        if (p > 0.0) {
            entropy -= p * (std::log(p) / std::log(2.0));
        }
    }
    trace.entropy = entropy;

    // Sort initial symbols by frequency descending for the table
    std::vector<std::shared_ptr<HuffmanNode>> sortedSymbols = nodes;
    std::sort(sortedSymbols.begin(), sortedSymbols.end(), [](const auto& a, const auto& b) {
        if (a->freq != b->freq) return a->freq > b->freq;
        return a->byteVal < b->byteVal;
    });

    // Min-heap simulation
    std::priority_queue<std::shared_ptr<HuffmanNode>,
                        std::vector<std::shared_ptr<HuffmanNode>>,
                        CompareNode> pq;

    for (const auto& node : nodes) {
        pq.push(node);
    }

    VisualizerTraceStep initStep;
    initStep.type = "INIT";
    initStep.description = "Populated min-priority queue with " + std::to_string(nodes.size()) + " unique symbol nodes.";
    auto pqCopy = pq;
    while (!pqCopy.empty()) {
        initStep.heapNodeIds.push_back(pqCopy.top()->id);
        pqCopy.pop();
    }
    trace.steps.push_back(initStep);

    std::shared_ptr<HuffmanNode> root;
    if (pq.size() == 1) {
        root = pq.top();
        pq.pop();
        VisualizerTraceStep step;
        step.type = "COMPLETE";
        step.description = "Single unique symbol present. Root leaf assigned code '0'.";
        step.heapNodeIds = {root->id};
        trace.steps.push_back(step);
    } else {
        int stepNum = 1;
        while (pq.size() > 1) {
            auto left = pq.top(); pq.pop();
            auto right = pq.top(); pq.pop();
            auto parent = std::make_shared<HuffmanNode>(nextId++, left->freq + right->freq, left, right);
            pq.push(parent);

            VisualizerTraceStep step;
            step.type = "MERGE";
            std::ostringstream desc;
            desc << "Step " << stepNum++ << ": Extracted min nodes [#" << left->id
                 << " (weight " << left->freq << ")] and [#" << right->id
                 << " (weight " << right->freq << ")]. Created parent [#" << parent->id
                 << " (weight " << parent->freq << ")].";
            step.description = desc.str();
            step.activeNodeIds = {left->id, right->id};
            step.createdNodeId = parent->id;

            auto copy = pq;
            while (!copy.empty()) {
                step.heapNodeIds.push_back(copy.top()->id);
                copy.pop();
            }
            trace.steps.push_back(step);
        }
        root = pq.top();
        pq.pop();

        VisualizerTraceStep compStep;
        compStep.type = "COMPLETE";
        compStep.description = "Huffman binary tree construction complete. Optimal prefix-free codes generated.";
        compStep.heapNodeIds = {root->id};
        trace.steps.push_back(compStep);
    }

    std::unordered_map<uint8_t, HuffmanCode> codeMap;
    generateCodes(root, "", codeMap);

    double weightedLengthSum = 0.0;
    for (const auto& node : sortedSymbols) {
        HuffmanVisualizerTrace::SymbolInfo info;
        info.byteVal = node->byteVal;
        info.label = getByteDisplayLabel(node->byteVal);
        info.hex = getByteHex(node->byteVal);
        info.freq = node->freq;
        info.percentage = (static_cast<double>(node->freq) / static_cast<double>(inputLen)) * 100.0;
        const auto& code = codeMap[node->byteVal];
        info.code = code.bitString;
        info.codeLength = code.length;
        weightedLengthSum += (static_cast<double>(node->freq) * static_cast<double>(code.length));
        trace.symbols.push_back(info);
    }
    trace.avgCodeLength = weightedLengthSum / static_cast<double>(inputLen);

    std::ostringstream treeStream;
    treeToJson(root, "", treeStream);
    trace.treeJson = treeStream.str();

    return trace;
}

} // namespace compressx

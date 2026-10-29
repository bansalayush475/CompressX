#include "rle.hpp"

namespace compressx {

bool RLE::compress(const uint8_t* input, size_t inputLen, std::vector<uint8_t>& outPayload) {
    outPayload.clear();
    if (inputLen == 0) {
        return true;
    }

    size_t i = 0;
    while (i < inputLen) {
        // Check for run length starting at i
        size_t runLen = 1;
        while (i + runLen < inputLen && input[i + runLen] == input[i] && runLen < 130) {
            runLen++;
        }

        if (runLen >= 3) {
            // Emit RUN packet: bit 7 is 1, lower 7 bits are (runLen - 3)
            uint8_t header = static_cast<uint8_t>(0x80 | (runLen - 3));
            outPayload.push_back(header);
            outPayload.push_back(input[i]);
            i += runLen;
        } else {
            // Collect literals until a run of >= 3 starts, or 128 literals reached, or end of input
            size_t litStart = i;
            size_t litCount = 0;

            while (i < inputLen && litCount < 128) {
                // Peek ahead: does a run of >= 3 start at i?
                size_t lookahead = 1;
                while (i + lookahead < inputLen && input[i + lookahead] == input[i] && lookahead < 3) {
                    lookahead++;
                }
                if (lookahead >= 3 && litCount > 0) {
                    // Stop literal block so run can begin
                    break;
                }
                litCount++;
                i++;
            }

            // Emit LITERAL packet: bit 7 is 0, lower 7 bits are (litCount - 1)
            uint8_t header = static_cast<uint8_t>(litCount - 1);
            outPayload.push_back(header);
            for (size_t k = 0; k < litCount; ++k) {
                outPayload.push_back(input[litStart + k]);
            }
        }
    }
    return true;
}

bool RLE::decompress(const uint8_t* payload, size_t payloadLen,
                     uint64_t expectedOriginalSize,
                     std::vector<uint8_t>& outRecovered) {
    outRecovered.clear();
    if (expectedOriginalSize == 0) {
        return true;
    }

    if (!payload || payloadLen == 0) {
        return false;
    }

    outRecovered.reserve(expectedOriginalSize);
    size_t pos = 0;

    while (pos < payloadLen && outRecovered.size() < expectedOriginalSize) {
        uint8_t header = payload[pos++];
        if ((header & 0x80) != 0) {
            // RUN packet
            size_t runLen = (header & 0x7F) + 3;
            if (pos >= payloadLen) {
                return false; // truncated payload
            }
            uint8_t byteVal = payload[pos++];
            if (outRecovered.size() + runLen > expectedOriginalSize) {
                return false; // overflow
            }
            outRecovered.insert(outRecovered.end(), runLen, byteVal);
        } else {
            // LITERAL packet
            size_t litLen = header + 1;
            if (pos + litLen > payloadLen) {
                return false; // truncated payload
            }
            if (outRecovered.size() + litLen > expectedOriginalSize) {
                return false; // overflow
            }
            outRecovered.insert(outRecovered.end(), payload + pos, payload + pos + litLen);
            pos += litLen;
        }
    }

    return (outRecovered.size() == expectedOriginalSize);
}

} // namespace compressx

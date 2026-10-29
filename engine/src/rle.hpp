#pragma once

#include <cstdint>
#include <vector>
#include <cstddef>

namespace compressx {

/**
 * Lossless Packet-Based Binary Run-Length Encoding (RLE)
 * 
 * Header byte format:
 * - Bit 7 = 1 (0x80 | (count - 3)): RUN PACKET.
 *   Repeats the following 1 byte (count) times, where count in [3, 130].
 * - Bit 7 = 0 (count - 1): LITERAL PACKET.
 *   Followed by (count) raw literal bytes, where count in [1, 128].
 * 
 * Runs exceeding 130 bytes are partitioned into multiple contiguous run packets.
 * Arbitrary binary sequences are preserved losslessly without escape-character collisions.
 */
class RLE {
public:
    static bool compress(const uint8_t* input, size_t inputLen, std::vector<uint8_t>& outPayload);
    static bool decompress(const uint8_t* payload, size_t payloadLen,
                           uint64_t expectedOriginalSize,
                           std::vector<uint8_t>& outRecovered);
};

} // namespace compressx

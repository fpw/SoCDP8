#ifndef SRC_PERIPHERALS_TELETYPE_H_
#define SRC_PERIPHERALS_TELETYPE_H_

#include <cstdint>
#include <cstddef>
#include <xtime_l.h>

class TeleType final {
public:
    TeleType();
    void setReaderInput(const uint8_t *data, size_t len);
    void onInterrupt();
private:
    uint32_t * const ioPtr;

    const uint8_t *readerData;
    size_t readerLen;
    size_t readerPos;
    XTime lastReadUpdate{};
    XTime lastPunchUpdate{};

    const uint8_t ADDR_KEYBOARD = 3;
    const uint8_t ADDR_PUNCH = 4;
};

#endif /* SRC_PERIPHERALS_TELETYPE_H_ */

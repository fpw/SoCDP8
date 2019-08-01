#include <xparameters.h>
#include <xil_printf.h>
#include "TeleType.h"

TeleType::TeleType():
    ioPtr((uint32_t *) (XPAR_IO_CONTROLLER_BASEADDR)),
    readerData(nullptr),
    readerLen(0),
    readerPos(0)
{
}

void TeleType::setReaderInput(const uint8_t* data, size_t len) {
    readerData = data;
    readerLen = len;
    readerPos = 0;
    XTime_GetTime(&lastReadUpdate);
    ioPtr[0] = readerData[readerPos++];
}

void TeleType::onInterrupt() {
    XTime now;
    XTime_GetTime(&now);

    if ((ioPtr[ADDR_KEYBOARD] & 0x100) == 0) {
        // data was read or flag cleared
        if (readerPos < readerLen) {
            XTime duration_ms = (now - lastReadUpdate) / (COUNTS_PER_SECOND / 1000);
            if (duration_ms > 10) {
                ioPtr[ADDR_KEYBOARD] = readerData[readerPos++];
                lastReadUpdate = now;
                xil_printf("Read %d / %d\n", readerPos, readerLen);
            }
        }
    }

    uint32_t punchData = ioPtr[ADDR_PUNCH];
    if ((punchData & 0x100) == 0x100) {
        // data is available
        XTime duration_ms = (now - lastPunchUpdate) / (COUNTS_PER_SECOND / 1000);
        if (duration_ms > 10) {
            char c = punchData & 0x7F;
            xil_printf("%c", c);
            lastPunchUpdate = now;
            ioPtr[ADDR_PUNCH] = 0;
        }
    }
}

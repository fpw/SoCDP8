GHDL=ghdl
GHDLFLAGS=--workdir=../../rtl/
MODULES=\
	../../rtl/socdp8_package.o \
	../../rtl/cpu/instructions/inst_common_package.o \
	../../rtl/cpu/instructions/and.o \
	../../rtl/cpu/instructions/tad.o \
	../../rtl/cpu/instructions/isz.o \
	../../rtl/cpu/instructions/dca.o \
	../../rtl/cpu/instructions/jms.o \
	../../rtl/cpu/instructions/jmp.o \
	../../rtl/cpu/instructions/iot.o \
	../../rtl/cpu/instructions/opr.o \
	../../rtl/cpu/instructions/eae/asr.o \
	../../rtl/cpu/instructions/eae/muy.o \
	../../rtl/cpu/instructions/eae/dvi.o \
	../../rtl/cpu/instructions/eae/nmi.o \
	../../rtl/cpu/instructions/eae/shl.o \
	../../rtl/cpu/instructions/eae/lsr.o \
	../../rtl/cpu/instructions/instruction_multiplexer.o \
	../../rtl/cpu/interrupt_controller.o \
	../../rtl/cpu/registers.o \
	../../rtl/cpu/timing_auto.o \
	../../rtl/cpu/timing_manual.o \
	../../rtl/cpu/memory_control.o \
	../../rtl/cpu/pdp8.o \
	./integration_test.o

test: $(MODULES)
	$(GHDL) -e $(GHDLFLAGS) integration_tb
	./integration_tb

# Binary depends on the object file
%: %.o
	$(GHDL) -e $(GHDLFLAGS) $@

# Object file depends on source
%.o: %.vhd
	$(GHDL) -a $(GHDLFLAGS) $<


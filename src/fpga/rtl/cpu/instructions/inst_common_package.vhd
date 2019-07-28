-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

package inst_common is
    -- input required to execute instructions
    type inst_input is record
        state: major_state;
        time_div: computer_time_state;
        mb: std_logic_vector(11 downto 0);
        ac_zero: std_logic;
        ac_neg: std_logic;
        link: std_logic;
        auto_index: std_logic;
        skip: std_logic;
        brk_req: std_logic;
        
    end record;
    
    --- the fetch cycles is the same for TAD, ISZ, DCA and JMS
    procedure fetch_cycle_mri (
        signal input: in inst_input;
        signal transfers: out register_transfers;
        signal state_next: out major_state
    );

    --- the defer cycle for all instructions except JMP
    procedure defer_cycle_not_jmp (
        signal input: in inst_input;
        signal transfers: out register_transfers;
        signal state_next: out major_state
    );
    
    -- TS4 is identical for many cycles, the part that starts with the BRK REQ check
    procedure ts4_back_to_fetch (
        signal input: in inst_input;
        signal transfers: out register_transfers;
        signal state_next: out major_state
    );
end inst_common;

package body inst_common is
    procedure fetch_cycle_mri (
        signal input: in inst_input;
        signal transfers: out register_transfers;
        signal state_next: out major_state
    ) is
    begin
        transfers <= nop_transfer;

        -- indirect bit decides next state
        if input.mb(8) = '1' then
            state_next <= STATE_DEFER;
        else
            state_next <= STATE_EXEC;
        end if;

        case input.time_div is
            when TS1 =>
                -- MA + 1 -> PC
                transfers.ma_enable <= '1';
                transfers.carry_insert <= '1';
                transfers.pc_load <= '1';
            when TS2 =>
                -- MEM -> MB
                transfers.mem_enable <= '1';
                transfers.mb_load <= '1';
            when TS3 =>
                null;
            when TS4 =>
                -- transfer the memory page only if the page bit is set (otherwise zero page)
                -- this combines MA and MEM into the new MA
                transfers.ma_enable_page <= input.mb(7);
                transfers.mem_enable_addr <= '1';
                transfers.ma_load <= '1';
        end case;
    end;

    procedure defer_cycle_not_jmp (
        signal input: in inst_input;
        signal transfers: out register_transfers;
        signal state_next: out major_state
    ) is
    begin
        transfers <= nop_transfer;
        state_next <= STATE_EXEC;

        case input.time_div is
            when TS1 =>
                null;
            when TS2 =>
                -- This transfer will increase the actual content in memory
                -- MEM -> MB (with auto index)
                transfers.mem_enable <= '1';
                transfers.carry_insert <= input.auto_index;
                transfers.mb_load <= '1';
            when TS3 =>
                null;
            when TS4 =>
                -- This transfer will increase the bus transfer again because the write-back is not
                -- done yet and the instruction should use the incremented value.
                -- MEM -> MA (with auto index)
                transfers.mem_enable <= '1';
                transfers.carry_insert <= input.auto_index;
                transfers.ma_load <= '1';
        end case;
    end;

    procedure ts4_back_to_fetch (
        signal input: in inst_input;
        signal transfers: out register_transfers;
        signal state_next: out major_state
    ) is
    begin
        transfers <= nop_transfer;
        state_next <= STATE_FETCH;

        if input.brk_req = '0' then
            -- PC (+ 1 if skip) -> MA
            transfers.pc_enable <= '1';
            transfers.carry_insert <= input.skip;
            transfers.ma_load <= '1';
        else
            -- TODO data breaks
        end if;
    end;
end package body;

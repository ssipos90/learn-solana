mod calculator;

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    entrypoint,
    entrypoint::ProgramResult,
    msg, pubkey::Pubkey, account_info::{AccountInfo, next_account_info}, program_error::ProgramError,
};
use crate::calculator::{Calculator, CalculatorInstruction};

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;

    if account.owner != program_id {
        msg!("account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    let mut calc = Calculator::try_from_slice(&account.data.borrow())?;

    let instruction = CalculatorInstruction::try_from_slice(instruction_data)?;

    calc.value = instruction.evaluate(calc.value);

    calc.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("Value is now: {}", calc.value);

    Ok(())
}

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    entrypoint,
    entrypoint::ProgramResult,
    msg, pubkey::Pubkey, account_info::{AccountInfo, next_account_info}, program_error::ProgramError,
};

#[derive(BorshDeserialize,BorshSerialize)]
pub struct MathStuffSquare {
    pub square: u32,
}

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;

    if account.owner != program_id {
        msg!("account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    msg!("Debug output:");
    msg!("Account ID: {}", account.key);
    msg!("Executable?: {}", account.executable);
    msg!("Lamports: {:#?}", account.lamports);
    msg!("Debug output complete.");

    msg!("Squaring value...");

    let mut math_stuff = MathStuffSquare::try_from_slice(&account.data.borrow())?;
    math_stuff.square = math_stuff.square.pow(2);
    math_stuff.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("New square is: {}", math_stuff.square);

    Ok(())
}

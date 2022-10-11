use solana_program::{
    entrypoint,
    entrypoint::ProgramResult,
    msg, pubkey::Pubkey, account_info::AccountInfo,
};

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Solana! (from Rust!)");
    Ok(())
}

use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod rock_paper_scissors {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[account]
pub struct Game {
    players: [Pubkey; 2],
    board: [Option<u8>; 2],
    state: GameState,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GameState {
    Active,
    Tie,
    Won {winner: Pubkey},
}

#[error_code]
pub enum RockPaperScissorsErros {
    GameAlreadyOver,
    GameAlreadyStarted
}

impl Game {
    pub const MAX_SIZE: usize = (32 * 2) + ((1 + 1) * 2) + (32 + 1);

    pub fn start(&mut self, players: [Pubkey; 2], rps: u8) -> Result<()> {
        require!(self.board[0] == None && self.board[1] == None, RockPaperScissorsErros::GameAlreadyStarted );
        self.players = players;
        self.board[0] = Some(rps);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

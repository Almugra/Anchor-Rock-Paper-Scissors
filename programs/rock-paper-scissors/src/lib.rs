use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod rock_paper_scissors {
    use super::*;

    pub fn setup_game(ctx: Context<SetupGame>, player_two: Pubkey, sign: u8) -> Result<()> {
        ctx.accounts
            .game
            .start([ctx.accounts.player_one.key(), player_two], sign)
    }

    pub fn play(ctx: Context<Play>, sign: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;

        require_keys_eq!(
            game.players[1],
            ctx.accounts.player.key(),
            RockPaperScissorsErros::NotPlayersTurn
        );

        game.play(sign)
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
    Won { winner: Pubkey },
}

#[error_code]
pub enum RockPaperScissorsErros {
    GameAlreadyOver,
    GameAlreadyStarted,
    NotPlayersTurn,
}

impl Game {
    pub const MAX_SIZE: usize = (32 * 2) + ((1 + 1) * 2) + (32 + 1);

    pub fn start(&mut self, players: [Pubkey; 2], sign: u8) -> Result<()> {
        require!(
            self.board[0].is_none() && self.board[1].is_none(),
            RockPaperScissorsErros::GameAlreadyStarted
        );
        self.players = players;
        self.board[0] = Some(sign);
        self.state = GameState::Active;
        Ok(())
    }

    pub fn is_active(&self) -> bool {
        self.state == GameState::Active
    }

    pub fn play(&mut self, sign: u8) -> Result<()> {
        require!(self.is_active(), RockPaperScissorsErros::GameAlreadyOver);
        self.board[1] = Some(sign);
        Self::update_state(self, sign);
        Ok(())
    }

    pub fn update_state(&mut self, p1: u8) {
        let p0 = self.board[0].unwrap();
        if p0 == p1 {
            self.state = GameState::Tie;
        } else {
            self.state = GameState::Won {
                winner: self.players[((p0 + 1) % 3 == p1) as usize],
            }
        }
    }
}

#[derive(Accounts)]
pub struct SetupGame<'info> {
    #[account(init, payer = player_one, space = 8 + Game::MAX_SIZE)]
    pub game: Account<'info, Game>,
    #[account(mut)]
    pub player_one: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Play<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    pub player: Signer<'info>,
}

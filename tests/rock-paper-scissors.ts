import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { expect } from "chai";
import { RockPaperScissors } from "../target/types/rock_paper_scissors";

describe("rock-paper-scissors", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.RockPaperScissors as Program<RockPaperScissors>;

    it("setup game", async () => {
        const gameKeypair = anchor.web3.Keypair.generate()
        const playerOne = (program.provider as anchor.AnchorProvider).wallet
        const playerTwo = anchor.web3.Keypair.generate()

        await program.methods
            .setupGame(playerTwo.publicKey, 0)
            .accounts({
                game: gameKeypair.publicKey,
                playerOne: playerOne.publicKey
            })
            .signers([gameKeypair])
            .rpc()

        let gameState = await program.account.game.fetch(gameKeypair.publicKey)
        expect(gameState.state).to.eql({active: {}})
        expect(gameState.board).to.eql([0, null])
        expect(gameState.players).to.eql([playerOne.publicKey, playerTwo.publicKey])

    });
});

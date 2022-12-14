import * as anchor from "@project-serum/anchor";
import { AnchorError, Program } from "@project-serum/anchor";
import { publicKey } from "@project-serum/anchor/dist/cjs/utils";
import { expect } from "chai";
import { RockPaperScissors } from "../target/types/rock_paper_scissors";

async function start(
    program: Program<RockPaperScissors>,
    playerOne,
    playerTwo,
    gameKeypair,
    sign,
) {
    await program.methods
        .setupGame(playerTwo.publicKey, sign)
        .accounts({
            game: gameKeypair.publicKey,
            playerOne: playerOne.publicKey
        })
        .signers([gameKeypair])
        .rpc()

    let gameState = await program.account.game.fetch(gameKeypair.publicKey)
    expect(gameState.state).to.eql({ active: {} })
    expect(gameState.board).to.eql([sign, null])
    expect(gameState.players).to.eql([playerOne.publicKey, playerTwo.publicKey])
}

async function play(
    program: Program<RockPaperScissors>,
    playerTwo,
    gameKeypair,
    playerOnePlay,
    playerTwoPlay,
    expectedState,
) {
    await program.methods
        .play(playerTwoPlay)
        .accounts({
            game: gameKeypair.publicKey,
            player: playerTwo.publicKey,
        })
        .signers(playerTwo instanceof (anchor.Wallet as any) ? [] : [playerTwo])
        .rpc()

    let gameState = await program.account.game.fetch(gameKeypair.publicKey)
    expect(gameState.state).to.eql(expectedState)
    expect(gameState.board).to.eql([playerOnePlay, playerTwoPlay])
}

describe("rock-paper-scissors", () => {
    // Configure the client to use the local cluster.
    anchor.setProvider(anchor.AnchorProvider.env());

    const program = anchor.workspace.RockPaperScissors as Program<RockPaperScissors>;
    const playerOne = (program.provider as anchor.AnchorProvider).wallet
    const playerTwo = anchor.web3.Keypair.generate()
    const playerOnePlay = 0;

    it("setup game", async () => {
        const gameKeypair = anchor.web3.Keypair.generate()
        await start(
            program,
            playerOne,
            playerTwo,
            gameKeypair,
            playerOnePlay,
        )
    });

    it("Its a Tie", async () => {
        const gameKeypair = anchor.web3.Keypair.generate()
        const playerOnePlay = 0;
        const playerTwoPlay = 0;

        await start(
            program,
            playerOne,
            playerTwo,
            gameKeypair,
            playerOnePlay,
        )

        await play(
            program,
            playerTwo,
            gameKeypair,
            playerOnePlay,
            playerTwoPlay,
            { tie: {} },
        )

    });

    it("Player One Wins", async () => {
        const gameKeypair = anchor.web3.Keypair.generate()
        const playerOnePlay = 0;
        const playerTwoPlay = 2;

        await start(
            program,
            playerOne,
            playerTwo,
            gameKeypair,
            playerOnePlay,
        )

        await play(
            program,
            playerTwo,
            gameKeypair,
            playerOnePlay,
            playerTwoPlay,
            { won: { winner: playerOne.publicKey } },
        )

    });

    it("Player Two Wins", async () => {
        const gameKeypair = anchor.web3.Keypair.generate()
        const playerOnePlay = 1;
        const playerTwoPlay = 2;

        await start(
            program,
            playerOne,
            playerTwo,
            gameKeypair,
            playerOnePlay,
        )

        await play(
            program,
            playerTwo,
            gameKeypair,
            playerOnePlay,
            playerTwoPlay,
            { won: { winner: playerTwo.publicKey } },
        )

    });

    it("Player One Cant Play Twice", async () => {
        const gameKeypair = anchor.web3.Keypair.generate()
        const playerOnePlay = 1;
        const playerTwoPlay = 2;

        await start(
            program,
            playerOne,
            playerTwo,
            gameKeypair,
            playerOnePlay,
        )

        try {
            await play(
                program,
                playerOne,
                gameKeypair,
                playerOnePlay,
                playerTwoPlay,
                { won: { winner: playerTwo.publicKey } },
            )
            chai.assert(false, "Should've failed but didn't")
        } catch (_err) {
            expect(_err).to.be.instanceof(AnchorError)
            const err: AnchorError = _err
            expect(err.error.errorCode.code).to.equal('NotPlayersTurn')
            expect(err.error.errorCode.number).to.equal(6002)
            expect(err.program.equals(program.programId)).is.true
            expect(err.error.comparedValues).to.deep.equal([
                playerTwo.publicKey,
                playerOne.publicKey,
            ])
        }

    });

    it("Game already over", async () => {
        const gameKeypair = anchor.web3.Keypair.generate()

        await start(
            program,
            playerOne,
            playerTwo,
            gameKeypair,
            1,
        )

        await play(
            program,
            playerTwo,
            gameKeypair,
            1,
            2,
            { won: { winner: playerTwo.publicKey } },
        )

        try {
            await play(
                program,
                playerTwo,
                gameKeypair,
                1,
                2,
                { won: { winner: playerTwo.publicKey } },
            )
            chai.assert(false, "Should've failed but didn't")
        } catch (_err) {
            expect(_err).to.be.instanceof(AnchorError)
            const err: AnchorError = _err
            expect(err.error.errorCode.code).to.equal('GameAlreadyOver')
            expect(err.error.errorCode.number).to.equal(6000)
            expect(err.program.equals(program.programId)).is.true
        }

    });
});

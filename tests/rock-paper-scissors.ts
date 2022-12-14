import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { RockPaperScissors } from "../target/types/rock_paper_scissors";

describe("rock-paper-scissors", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.RockPaperScissors as Program<RockPaperScissors>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});

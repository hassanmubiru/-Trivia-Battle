/**
 * TriviaBattle Contract Tests
 * Run with: npx hardhat test
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('TriviaBattleV2', function () {
  let triviaBattle;
  let owner;
  let player1;
  let player2;
  let cUSD;
  let USDC;
  let USDT;

  // Mock ERC20 tokens for testing
  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    // Deploy mock ERC20 tokens
    const MockERC20 = await ethers.getContractFactory('MockERC20');
    cUSD = await MockERC20.deploy('Celo Dollar', 'cUSD', 18);
    USDC = await MockERC20.deploy('USD Coin', 'USDC', 6);
    USDT = await MockERC20.deploy('Tether USD', 'USDT', 6);

    // Deploy TriviaBattle contract
    const TriviaBattle = await ethers.getContractFactory('TriviaBattleV2');
    triviaBattle = await TriviaBattle.deploy();

    // Add supported tokens
    await triviaBattle.addSupportedToken(cUSD.address);
    await triviaBattle.addSupportedToken(USDC.address);
    await triviaBattle.addSupportedToken(USDT.address);

    // Mint tokens to players
    const amount = ethers.parseEther('100');
    await cUSD.mint(player1.address, amount);
    await cUSD.mint(player2.address, amount);
    await USDC.mint(player1.address, ethers.parseUnits('100', 6));
    await USDC.mint(player2.address, ethers.parseUnits('100', 6));
  });

  describe('Match Creation', function () {
    it('Should create a match with cUSD', async function () {
      const entryFee = ethers.parseEther('0.1');
      await cUSD.connect(player1).approve(triviaBattle.address, entryFee);

      const tx = await triviaBattle
        .connect(player1)
        .createMatch(cUSD.address, entryFee, 2);
      const receipt = await tx.wait();

      const matchCreatedEvent = receipt.logs.find(
        (log) => log.topics[0] === triviaBattle.interface.getEvent('MatchCreated').topicHash
      );

      expect(matchCreatedEvent).to.not.be.undefined;
    });

    it('Should reject match creation with unsupported token', async function () {
      const entryFee = ethers.parseEther('0.1');
      await expect(
        triviaBattle.connect(player1).createMatch(ethers.ZeroAddress, entryFee, 2)
      ).to.be.revertedWith('Unsupported token');
    });

    it('Should reject match creation with fee too low', async function () {
      const entryFee = ethers.parseEther('0.05');
      await cUSD.connect(player1).approve(triviaBattle.address, entryFee);

      await expect(
        triviaBattle.connect(player1).createMatch(cUSD.address, entryFee, 2)
      ).to.be.revertedWith('Entry fee too low');
    });
  });

  describe('Match Joining', function () {
    it('Should allow player to join match', async function () {
      const entryFee = ethers.parseEther('0.1');
      await cUSD.connect(player1).approve(triviaBattle.address, entryFee);
      await triviaBattle.connect(player1).createMatch(cUSD.address, entryFee, 2);

      await cUSD.connect(player2).approve(triviaBattle.address, entryFee);
      await triviaBattle.connect(player2).joinMatch(1);

      const matchDetails = await triviaBattle.getMatchDetails(1);
      expect(matchDetails.currentPlayers).to.equal(2);
    });
  });

  describe('Answer Submission', function () {
    beforeEach(async function () {
      const entryFee = ethers.parseEther('0.1');
      await cUSD.connect(player1).approve(triviaBattle.address, entryFee);
      await cUSD.connect(player2).approve(triviaBattle.address, entryFee);

      await triviaBattle.connect(player1).createMatch(cUSD.address, entryFee, 2);
      await triviaBattle.connect(player2).joinMatch(1);

      // Start match
      await triviaBattle.connect(owner).startMatch(1, [1, 2, 3], [0, 1, 2]);
    });

    it('Should allow player to submit answer', async function () {
      await triviaBattle.connect(player1).submitAnswer(1, 1, 0);
      const score = await triviaBattle.getPlayerScore(1, player1.address);
      // Score will be 0 until match ends
      expect(score).to.equal(0);
    });
  });

  // Add more test cases as needed
});


const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockERC20 - Production Test Suite", function () {
  let mockToken;
  let owner;
  let user1;
  let user2;
  let user3;

  const TOKEN_NAME = "Mock USD Coin";
  const TOKEN_SYMBOL = "mUSD";
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million tokens
  const FAUCET_AMOUNT = ethers.parseEther("1000"); // 1000 tokens
  const MAX_SUPPLY = ethers.parseEther("1000000000"); // 1 billion tokens
  const FAUCET_COOLDOWN = 86400; // 1 day in seconds

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy(TOKEN_NAME, TOKEN_SYMBOL);
    await mockToken.waitForDeployment();
  });

  describe("✅ Deployment & Initialization", function () {
    it("Should deploy with correct name and symbol", async function () {
      expect(await mockToken.name()).to.equal(TOKEN_NAME);
      expect(await mockToken.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should have correct initial supply", async function () {
      const balance = await mockToken.balanceOf(owner.address);
      expect(balance).to.equal(INITIAL_SUPPLY);
    });

    it("Should have 18 decimals by default", async function () {
      expect(await mockToken.decimals()).to.equal(18);
    });

    it("Should set owner correctly", async function () {
      expect(await mockToken.owner()).to.equal(owner.address);
    });

    it("Should grant DEFAULT_ADMIN_ROLE to owner", async function () {
      const adminRole = await mockToken.DEFAULT_ADMIN_ROLE();
      expect(await mockToken.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should grant MINTER_ROLE to owner", async function () {
      const minterRole = await mockToken.MINTER_ROLE();
      expect(await mockToken.hasRole(minterRole, owner.address)).to.be.true;
    });

    it("Should grant PAUSER_ROLE to owner", async function () {
      const pauserRole = await mockToken.PAUSER_ROLE();
      expect(await mockToken.hasRole(pauserRole, owner.address)).to.be.true;
    });

    it("Should grant FAUCET_ROLE to owner", async function () {
      const faucetRole = await mockToken.FAUCET_ROLE();
      expect(await mockToken.hasRole(faucetRole, owner.address)).to.be.true;
    });

    it("Should return correct token info", async function () {
      const info = await mockToken.tokenInfo();
      expect(info.name).to.equal(TOKEN_NAME);
      expect(info.symbol).to.equal(TOKEN_SYMBOL);
      expect(info.decimalsValue).to.equal(18);
      expect(info.totalSupplyValue).to.equal(INITIAL_SUPPLY);
      expect(info.maxSupply).to.equal(MAX_SUPPLY);
      expect(info.paused).to.be.false;
    });
  });

  describe("✅ Minting Functionality", function () {
    it("Should mint tokens to user with MINTER_ROLE", async function () {
      const mintAmount = ethers.parseEther("1000");
      await mockToken.mint(user1.address, mintAmount);

      const balance = await mockToken.balanceOf(user1.address);
      expect(balance).to.equal(mintAmount);
    });

    it("Should NOT mint to zero address", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        mockToken.mint(ethers.ZeroAddress, mintAmount)
      ).to.be.revertedWith("Cannot mint to zero address");
    });

    it("Should NOT mint zero amount", async function () {
      await expect(
        mockToken.mint(user1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should NOT exceed maximum supply", async function () {
      const exceedAmount = MAX_SUPPLY.add(ethers.parseEther("1"));
      await expect(
        mockToken.mint(user1.address, exceedAmount)
      ).to.be.revertedWith("Exceeds maximum supply");
    });

    it("Should NOT mint without MINTER_ROLE", async function () {
      const mintAmount = ethers.parseEther("1000");
      const minterRole = await mockToken.MINTER_ROLE();
      await expect(
        mockToken.connect(user1).mint(user1.address, mintAmount)
      ).to.be.revertedWithCustomError({ interface: mockToken.interface }, "AccessControlUnauthorizedAccount");
    });

    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(mockToken.mint(user1.address, mintAmount))
        .to.emit(mockToken, "TokensMinted")
        .withArgs(user1.address, mintAmount, owner.address);
    });

    it("Should allow granting MINTER_ROLE to users", async function () {
      const minterRole = await mockToken.MINTER_ROLE();
      await mockToken.grantMinterRole(user1.address);
      expect(await mockToken.hasRole(minterRole, user1.address)).to.be.true;
    });
  });

  describe("✅ Burning Functionality", function () {
    beforeEach(async function () {
      // Mint tokens to user1 for burning tests
      await mockToken.mint(user1.address, ethers.parseEther("5000"));
    });

    it("Should burn tokens from caller", async function () {
      const burnAmount = ethers.parseEther("1000");
      const balanceBefore = await mockToken.balanceOf(user1.address);

      await mockToken.connect(user1).burn(burnAmount);

      const balanceAfter = await mockToken.balanceOf(user1.address);
      expect(balanceAfter).to.equal(balanceBefore.sub(burnAmount));
    });

    it("Should NOT burn zero amount", async function () {
      await expect(
        mockToken.connect(user1).burn(0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should NOT burn more than balance", async function () {
      const balance = await mockToken.balanceOf(user1.address);
      const excessAmount = balance.add(ethers.parseEther("1"));

      await expect(
        mockToken.connect(user1).burn(excessAmount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should emit TokensBurned event", async function () {
      const burnAmount = ethers.parseEther("500");
      await expect(mockToken.connect(user1).burn(burnAmount))
        .to.emit(mockToken, "TokensBurned")
        .withArgs(user1.address, burnAmount);
    });

    it("Should allow MINTER_ROLE to burn from address", async function () {
      const burnAmount = ethers.parseEther("1000");
      await mockToken.burnFrom(user1.address, burnAmount);

      const balance = await mockToken.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("4000"));
    });
  });

  describe("✅ Faucet Functionality", function () {
    it("Should allow user with FAUCET_ROLE to claim tokens", async function () {
      const faucetRole = await mockToken.FAUCET_ROLE();
      await mockToken.grantFaucetRole(user1.address);

      const balanceBefore = await mockToken.balanceOf(user1.address);
      await mockToken.connect(user1).faucet(FAUCET_AMOUNT);
      const balanceAfter = await mockToken.balanceOf(user1.address);

      expect(balanceAfter).to.equal(balanceBefore.add(FAUCET_AMOUNT));
    });

    it("Should allow public faucet without special role", async function () {
      const balanceBefore = await mockToken.balanceOf(user1.address);
      await mockToken.connect(user1).publicFaucet();
      const balanceAfter = await mockToken.balanceOf(user1.address);

      expect(balanceAfter).to.equal(balanceBefore.add(FAUCET_AMOUNT));
    });

    it("Should enforce faucet cooldown", async function () {
      await mockToken.connect(user1).publicFaucet();

      // Try to claim again immediately
      await expect(
        mockToken.connect(user1).publicFaucet()
      ).to.be.revertedWith("Faucet cooldown not met");
    });

    it("Should allow faucet claim after cooldown expires", async function () {
      // First claim
      await mockToken.connect(user1).publicFaucet();

      // Advance time by 1 day + 1 second
      await ethers.provider.send("hardhat_mine", ["0x15181"]); // ~1 day worth of blocks
      await ethers.provider.send("evm_increaseTime", [FAUCET_COOLDOWN + 1]);
      await ethers.provider.send("hardhat_mine", ["0x1"]); // Mine new block

      // Second claim should succeed
      const balanceBefore = await mockToken.balanceOf(user1.address);
      await mockToken.connect(user1).publicFaucet();
      const balanceAfter = await mockToken.balanceOf(user1.address);

      expect(balanceAfter).to.equal(balanceBefore.add(FAUCET_AMOUNT));
    });

    it("Should NOT exceed faucet limit", async function () {
      const faucetRole = await mockToken.FAUCET_ROLE();
      await mockToken.grantFaucetRole(user1.address);

      const excessAmount = FAUCET_AMOUNT.add(ethers.parseEther("1"));
      await expect(
        mockToken.connect(user1).faucet(excessAmount)
      ).to.be.revertedWith("Exceeds faucet limit");
    });

    it("Should emit FaucetUsed event", async function () {
      await expect(mockToken.connect(user1).publicFaucet())
        .to.emit(mockToken, "FaucetUsed");
    });

    it("Should return correct cooldown remaining", async function () {
      // First claim
      await mockToken.connect(user1).publicFaucet();

      // Check cooldown remaining
      const remaining = await mockToken.faucetCooldownRemaining(user1.address);
      expect(remaining).to.be.greaterThan(0);
      expect(remaining).to.be.lessThanOrEqual(FAUCET_COOLDOWN);
    });

    it("Should return 0 cooldown when ready", async function () {
      const remaining = await mockToken.faucetCooldownRemaining(user1.address);
      expect(remaining).to.equal(0);
    });
  });

  describe("✅ Pause/Unpause Functionality", function () {
    it("Should pause token transfers", async function () {
      await mockToken.mint(user1.address, ethers.parseEther("1000"));
      await mockToken.pause();

      expect(await mockToken.paused()).to.be.true;
    });

    it("Should NOT transfer when paused", async function () {
      await mockToken.mint(user1.address, ethers.parseEther("1000"));
      await mockToken.pause();

      await expect(
        mockToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError({ interface: mockToken.interface }, "EnforcedPause");
    });

    it("Should unpause token transfers", async function () {
      await mockToken.pause();
      await mockToken.unpause();

      expect(await mockToken.paused()).to.be.false;
    });

    it("Should NOT pause without PAUSER_ROLE", async function () {
      await expect(
        mockToken.connect(user1).pause()
      ).to.be.revertedWithCustomError({ interface: mockToken.interface }, "AccessControlUnauthorizedAccount");
    });

    it("Should emit PauseToggled event", async function () {
      await expect(mockToken.pause())
        .to.emit(mockToken, "PauseToggled")
        .withArgs(true, owner.address);

      await expect(mockToken.unpause())
        .to.emit(mockToken, "PauseToggled")
        .withArgs(false, owner.address);
    });
  });

  describe("✅ Transfer Functionality", function () {
    beforeEach(async function () {
      await mockToken.mint(user1.address, ethers.parseEther("5000"));
    });

    it("Should transfer tokens between users", async function () {
      const transferAmount = ethers.parseEther("1000");
      const balanceBefore = await mockToken.balanceOf(user2.address);

      await mockToken.connect(user1).transfer(user2.address, transferAmount);

      const balanceAfter = await mockToken.balanceOf(user2.address);
      expect(balanceAfter).to.equal(balanceBefore.add(transferAmount));
    });

    it("Should NOT transfer when paused", async function () {
      await mockToken.pause();

      await expect(
        mockToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError({ interface: mockToken.interface }, "EnforcedPause");
    });

    it("Should transfer with approval", async function () {
      const transferAmount = ethers.parseEther("1000");
      const approveAmount = ethers.parseEther("1500");

      await mockToken.connect(user1).approve(user2.address, approveAmount);
      await mockToken.connect(user2).transferFrom(user1.address, user3.address, transferAmount);

      expect(await mockToken.balanceOf(user3.address)).to.equal(transferAmount);
    });

    it("Should track allowance correctly", async function () {
      const approveAmount = ethers.parseEther("1000");
      await mockToken.connect(user1).approve(user2.address, approveAmount);

      expect(await mockToken.allowance(user1.address, user2.address)).to.equal(approveAmount);
    });

    it("Should increase allowance", async function () {
      const initialAmount = ethers.parseEther("1000");
      const increaseAmount = ethers.parseEther("500");

      await mockToken.connect(user1).approve(user2.address, initialAmount);
      await mockToken.connect(user1).increaseAllowance(user2.address, increaseAmount);

      expect(await mockToken.allowance(user1.address, user2.address)).to.equal(
        initialAmount.add(increaseAmount)
      );
    });

    it("Should decrease allowance", async function () {
      const initialAmount = ethers.parseEther("1000");
      const decreaseAmount = ethers.parseEther("300");

      await mockToken.connect(user1).approve(user2.address, initialAmount);
      await mockToken.connect(user1).decreaseAllowance(user2.address, decreaseAmount);

      expect(await mockToken.allowance(user1.address, user2.address)).to.equal(
        initialAmount.sub(decreaseAmount)
      );
    });
  });

  describe("✅ Decimals Functionality", function () {
    it("Should allow owner to set custom decimals", async function () {
      await mockToken.setDecimals(6);
      expect(await mockToken.decimals()).to.equal(6);
    });

    it("Should NOT allow decimals > 18", async function () {
      await expect(
        mockToken.setDecimals(19)
      ).to.be.revertedWith("Decimals cannot exceed 18");
    });

    it("Should NOT allow non-owner to set decimals", async function () {
      await expect(
        mockToken.connect(user1).setDecimals(8)
      ).to.be.revertedWithCustomError({ interface: mockToken.interface }, "OwnableUnauthorizedAccount");
    });

    it("Should emit DecimalsSet event", async function () {
      await expect(mockToken.setDecimals(8))
        .to.emit(mockToken, "DecimalsSet")
        .withArgs(8);
    });
  });

  describe("✅ Role Management", function () {
    it("Should grant MINTER_ROLE via grantMinterRole", async function () {
      const minterRole = await mockToken.MINTER_ROLE();
      await mockToken.grantMinterRole(user1.address);

      expect(await mockToken.hasRole(minterRole, user1.address)).to.be.true;
    });

    it("Should grant PAUSER_ROLE via grantPauserRole", async function () {
      const pauserRole = await mockToken.PAUSER_ROLE();
      await mockToken.grantPauserRole(user1.address);

      expect(await mockToken.hasRole(pauserRole, user1.address)).to.be.true;
    });

    it("Should grant FAUCET_ROLE via grantFaucetRole", async function () {
      const faucetRole = await mockToken.FAUCET_ROLE();
      await mockToken.grantFaucetRole(user1.address);

      expect(await mockToken.hasRole(faucetRole, user1.address)).to.be.true;
    });

    it("Should only allow owner to grant roles", async function () {
      await expect(
        mockToken.connect(user1).grantMinterRole(user2.address)
      ).to.be.revertedWithCustomError({ interface: mockToken.interface }, "OwnableUnauthorizedAccount");
    });
  });

  describe("✅ Balance & Supply Management", function () {
    it("Should report correct total supply", async function () {
      const supply = await mockToken.totalSupply();
      expect(supply).to.equal(INITIAL_SUPPLY);
    });

    it("Should track individual balances", async function () {
      await mockToken.mint(user1.address, ethers.parseEther("1000"));
      expect(await mockToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should update balance on transfer", async function () {
      const transferAmount = ethers.parseEther("100");
      await mockToken.mint(user1.address, ethers.parseEther("1000"));

      await mockToken.connect(user1).transfer(user2.address, transferAmount);

      expect(await mockToken.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
      expect(await mockToken.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should update balance on burn", async function () {
      const burnAmount = ethers.parseEther("100");
      await mockToken.mint(user1.address, ethers.parseEther("1000"));

      await mockToken.connect(user1).burn(burnAmount);

      expect(await mockToken.balanceOf(user1.address)).to.equal(ethers.parseEther("900"));
    });
  });

  describe("✅ Real-World Testing Scenarios", function () {
    it("Should simulate Trivia Battle game flow", async function () {
      // 1. Distribute tokens to players
      const playerStake = ethers.parseEther("100");
      await mockToken.mint(user1.address, ethers.parseEther("10000"));
      await mockToken.mint(user2.address, ethers.parseEther("10000"));

      // 2. Players approve TriviaBattle contract (using owner as mock contract)
      await mockToken.connect(user1).approve(owner.address, playerStake);
      await mockToken.connect(user2).approve(owner.address, playerStake);

      // 3. Check approvals
      expect(await mockToken.allowance(user1.address, owner.address)).to.equal(playerStake);
      expect(await mockToken.allowance(user2.address, owner.address)).to.equal(playerStake);

      // 4. Simulate stake collection
      await mockToken.connect(user1).transferFrom(user1.address, owner.address, playerStake);
      await mockToken.connect(user2).transferFrom(user2.address, owner.address, playerStake);

      // 5. Verify stakes collected
      expect(await mockToken.balanceOf(owner.address)).to.equal(
        INITIAL_SUPPLY.add(ethers.parseEther("200"))
      );

      // 6. Distribute rewards to winner
      const totalStake = playerStake.mul(2);
      const winnerReward = totalStake; // Simplified 1:1 reward
      await mockToken.transfer(user1.address, winnerReward);

      // 7. Verify final balances
      expect(await mockToken.balanceOf(user1.address)).to.be.greaterThan(ethers.parseEther("10000"));
      expect(await mockToken.balanceOf(user2.address)).to.equal(ethers.parseEther("9900"));
    });

    it("Should handle concurrent faucet claims with cooldown", async function () {
      // User1 claims
      await mockToken.connect(user1).publicFaucet();
      const balance1 = await mockToken.balanceOf(user1.address);

      // User2 claims
      await mockToken.connect(user2).publicFaucet();
      const balance2 = await mockToken.balanceOf(user2.address);

      // User3 claims
      await mockToken.connect(user3).publicFaucet();
      const balance3 = await mockToken.balanceOf(user3.address);

      // All should have faucet amount
      expect(balance1).to.equal(FAUCET_AMOUNT);
      expect(balance2).to.equal(FAUCET_AMOUNT);
      expect(balance3).to.equal(FAUCET_AMOUNT);
    });

    it("Should maintain system stability under multiple operations", async function () {
      // Mint multiple times
      for (let i = 0; i < 5; i++) {
        await mockToken.mint(user1.address, ethers.parseEther("1000"));
      }

      // Transfer multiple times
      for (let i = 0; i < 3; i++) {
        await mockToken.connect(user1).transfer(user2.address, ethers.parseEther("500"));
      }

      // Check final state
      const totalSupply = await mockToken.totalSupply();
      const user1Balance = await mockToken.balanceOf(user1.address);
      const user2Balance = await mockToken.balanceOf(user2.address);
      const ownerBalance = await mockToken.balanceOf(owner.address);

      expect(user1Balance.add(user2Balance).add(ownerBalance)).to.equal(totalSupply);
    });
  });
});

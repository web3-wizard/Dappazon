const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ID = 1;
const NAME = "Shoes";
const CATEGORY = "Clothing";
const IMAGE = "IPFS File link";
const COST = tokens(1);
const RATING = 4;
const STOCK = 5;

describe("Dappazon", () => {

  let dappazon;
  let deployer, buyer;

  beforeEach(async () => {
    // setup accounts
    [deployer, buyer] = await ethers.getSigners();

    // deploy the contract
    const Dappazon = await ethers.getContractFactory("Dappazon");
    dappazon = await Dappazon.deploy();
  })

  describe("Deployment", () => {
    it('Set the Owner', async () => {
      // check for owner
      expect(await dappazon.owner()).to.equal(deployer.address);
    });

    it('Has a Name', async () => {
      // check for the name
      expect(await dappazon.name()).to.equal("Dappazon");
    });
  });

  describe("Listing", () => {
    let transaction;

    beforeEach(async () => {
      transaction = await dappazon.connect(deployer).list(
          ID,NAME,CATEGORY,IMAGE,COST,RATING,STOCK
        );

      await transaction.wait();
    });

    it("Returns item attributes", async () => {
      const item = await dappazon.items(ID);
      expect(item.id).to.equal(ID);
      expect(item.name).to.equal(NAME);
      expect(item.category).to.equal(CATEGORY);
      expect(item.image).to.equal(IMAGE);
      expect(item.cost).to.equal(COST);
      expect(item.rating).to.equal(RATING);
      expect(item.stock).to.equal(STOCK);
    });

    it("Emit List Event", async () => {
      await expect(transaction).to.emit(dappazon, "List");
      await expect(transaction).to.emit(dappazon, "List").withArgs(NAME, COST, STOCK);
    });
  });

  describe("Buying", () => {
    let transaction;

    beforeEach(async () => {
      // List an item
      transaction = await dappazon.connect(deployer).list(
        ID,NAME,CATEGORY,IMAGE,COST,RATING,STOCK
      );
      await transaction.wait();

      // Buy an item
      transaction = await dappazon.connect(buyer).buy(ID, {value: COST });

    });

    it("Updates buyer's order count", async () => {
      const result = await dappazon.orderCount(buyer.address);
      
      expect(result).to.equal(1);
    });

    it("Adds the order", async () => {
      const order = await dappazon.orders(buyer.address, 1);

      expect(order.time).to.be.greaterThan(0);
      expect(order.item.name).to.equal(NAME);
    });

    it("Updates the contract balance", async () => {
      const result = await ethers.provider.getBalance(dappazon.address);
      expect(result).to.equal(COST);
    });

    it("Emits Buy Event", async() => {
      await expect(transaction).to.emit(dappazon, "Buy");
      await expect(transaction)
      .to.emit(dappazon, "Buy")
      .withArgs(buyer.address, 1, ID);
    });

  });

  describe("Withdraw Fund", () => {
    let transaction;

    beforeEach(async () => {
      // List an item
      transaction = await dappazon.connect(deployer).list(
        ID,NAME,CATEGORY,IMAGE,COST,RATING,STOCK
      );
      await transaction.wait();

      // Buy an item
      transaction = await dappazon.connect(buyer).buy(ID, {value: COST });
    });

    it("Updates the owner balance", async () => {
      const beforeBalance = await ethers.provider.getBalance(deployer.address);
      const result = await dappazon.withdraw();
      const afterBalance = await ethers.provider.getBalance(deployer.address);

      expect(afterBalance).to.be.greaterThan(beforeBalance);
    });

    it("Updates the contract balance", async () => {
      await dappazon.withdraw();
      const result = await ethers.provider.getBalance(dappazon.address);

      expect(result).to.equal(0);
    });
  });
  
});

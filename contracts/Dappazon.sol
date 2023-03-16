// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Dappazon {
	
	string public name ;    // contract name
	address public owner;   // contract owner

	struct Item {
		uint256 id;
		string name;
		string category;
		string image;
		uint256 cost;
		uint256 rating;
		uint256 stock;
	}

	struct Order {
		uint256 time;
		Item item;
	}

	mapping(uint256 => Item) public items;
	mapping(address => uint256) public orderCount;
	mapping(address => mapping(uint256 => Order)) public orders;

	event List(string name, uint256 cost, uint256 quantity);
	event Buy(address buyer, uint256 orderId, uint256 itemId);

	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	constructor() {
		name = "Dappazon";
		owner = msg.sender;
	}

	// List Products
	function list(
		uint256 _id,
		string memory _name,
		string memory _category,
		string memory _image,
		uint256 _cost,
		uint256 _rating,
		uint256 _stock
	) public onlyOwner {

		// Create Item Struct
		Item memory item = Item(_id,_name,_category,_image,_cost,_rating,_stock);

		// Save the item into Blockchain
		items[_id] = item;

		// Emit an event
		emit List(_name, _cost, _stock);

	}

	// Buy Products
	function buy(uint256 _id) public payable {
		// Fetch the item
		Item memory item = items[_id];

		// Require item is in stock
		require(item.stock > 0);

		// Require enough ether to buy item
		require(msg.value >= item.cost);

		// Create an order
		Order memory order = Order(block.timestamp, item);

		// save order to blockhain and add oder for user
		orderCount[msg.sender]++; // <-- Order ID
		orders[msg.sender][orderCount[msg.sender]] = order;

		// Substract stock of the item
		items[_id].stock--;

		// emit buy event
		emit Buy(msg.sender, orderCount[msg.sender], item.id);

	}

	// Withdraw Funds
	function withdraw() public onlyOwner {
		(bool success, ) = owner.call{value: address(this).balance}("");
		require(success);
	}

}

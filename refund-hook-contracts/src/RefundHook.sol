// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "openzeppelin/utils/math/SafeMath.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {ISafe} from "safe-core-protocol/interfaces/Accounts.sol";
import {SafeTransaction, SafeRootAccess} from "safe-core-protocol/DataTypes.sol";

contract RefundHook {
    using SafeMath for uint256;

    uint256 gasBefore = 1;
    uint256 gasAfter = 1;

    address nativeTokenWrapped =
        address(0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6);

    address refundAddress = address(0xCBB5231F273Fc3E5b917a0fFC582121216C36437);

    constructor() {}

    function preCheck(
        ISafe safe,
        SafeTransaction calldata tx,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData) {
        gasBefore = gasleft();
    }

    function preCheckRootAccess(
        ISafe safe,
        SafeRootAccess calldata rootAccess,
        uint256 executionType,
        bytes calldata executionMeta
    ) external returns (bytes memory preCheckData) {}

    function postCheck(
        ISafe safe,
        bool success,
        bytes calldata preCheckData
    ) external {
        uint256 gasUsed = gasBefore - gasleft();

        // Charge 2x of gas fee for executing delayed transactions
        uint256 fee = gasUsed * tx.gasprice * 2;
        IERC20(nativeTokenWrapped).transferFrom(msg.sender, refundAddress, fee);
    }
}

import { ethers } from 'ethers';
import { FIELD_BOOKING_ABI } from './abi/index.js';
import NetworkConfig from './NetworkConfig.js';

/**
 * Production-grade Contract Service
 * Handles all blockchain interactions with simplified, clean API
 */
class ContractService {

  // ==================== INTERNAL GUARDS ====================

  static _getConfiguredContractAddress() {
    const raw = process.env.REACT_APP_CONTRACT_ADDRESS;
    const contractAddress = typeof raw === 'string' ? raw.trim() : '';

    if (!contractAddress) {
      throw new Error(
        'Thiếu REACT_APP_CONTRACT_ADDRESS (contract address). ' +
        'Nếu chạy local: tạo frontend/.env.local. ' +
        'Nếu deploy: set GitHub Variables/Secrets rồi build lại.'
      );
    }

    if (!ethers.isAddress(contractAddress)) {
      throw new Error(
        `REACT_APP_CONTRACT_ADDRESS không hợp lệ: ${contractAddress}. ` +
        'Hãy kiểm tra lại address 0x... (40 hex ký tự).'
      );
    }

    return contractAddress;
  }

  static _assertExpectedNetwork(actualChainId) {
    const expectedRaw = process.env.REACT_APP_NETWORK_ID;
    if (!expectedRaw) return;

    const expected = Number.parseInt(String(expectedRaw), 10);
    if (!Number.isFinite(expected)) return;

    const actual = Number(actualChainId);
    if (Number.isFinite(actual) && actual !== expected) {
      throw new Error(
        `Sai network: MetaMask đang ở chainId=${actual}, nhưng app được build cho chainId=${expected}. ` +
        'Hãy switch network trong MetaMask rồi thử lại.'
      );
    }
  }

  static _requireMethod(contract, methodName) {
    if (!contract) {
      throw new Error('Contract chưa được khởi tạo');
    }
    if (typeof contract[methodName] !== 'function') {
      throw new Error(
        `ABI mismatch: contract.${methodName} không tồn tại. ` +
        'Hãy hard refresh (Ctrl+Shift+R) hoặc restart server/build để load bundle mới.'
      );
    }
  }
  
  // ==================== WALLET CONNECTION ====================
  
  /**
   * Connect to MetaMask wallet
   * @returns {Object} { isConnected, address, provider, signer, contract, network }
   */
  static async connectWallet(selectedAddress = null) {
    console.log('[ContractService] connectWallet() called', { selectedAddress });
    
    if (!window.ethereum) {
      throw new Error('MetaMask chưa được cài đặt. Vui lòng cài MetaMask extension.');
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Get or request account
      let accountToUse = selectedAddress;
      if (!accountToUse) {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        if (!accounts || accounts.length === 0) {
          throw new Error('Không nhận được account từ MetaMask');
        }
        accountToUse = accounts[0];
      }
      
      const signer = await provider.getSigner(accountToUse);
      const network = await provider.getNetwork();
      
      console.log('[ContractService] ✅ Connected to', network.name, 'ChainID:', network.chainId);

      // Ensure the build-time config matches the user's MetaMask network
      this._assertExpectedNetwork(network.chainId);

      // Prevent ethers v6: INVALID_ARGUMENT (target=null)
      const contractAddress = this._getConfiguredContractAddress();
      const contract = new ethers.Contract(
        contractAddress,
        FIELD_BOOKING_ABI,
        signer
      );

      return {
        isConnected: true,
        address: accountToUse,
        provider,
        signer,
        contract,
        network: network.name
      };
    } catch (error) {
      console.error('[ContractService] Connection error:', error);
      throw error;
    }
  }

  /**
   * Switch MetaMask network by configured network name
   * Used by NetworkSwitcher component.
   */
  static async switchNetwork(networkName) {
    if (!window.ethereum) {
      throw new Error('MetaMask chưa được cài đặt. Vui lòng cài MetaMask extension.');
    }

    const network = NetworkConfig.getByName(networkName);
    if (!network || !network.chainId) {
      throw new Error(`Network không được hỗ trợ: ${networkName}`);
    }

    const chainIdHex = `0x${Number(network.chainId).toString(16)}`;

    // Some networks rely on env-provided RPC (e.g., Sepolia)
    if (!network.rpc) {
      throw new Error(
        `Chưa có RPC cho ${networkName}. ` +
        'Hãy cấu hình biến môi trường (ví dụ REACT_APP_SEPOLIA_RPC) rồi build lại.'
      );
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      NetworkConfig.setNetwork(Number(network.chainId));
      return true;
    } catch (error) {
      const code = error?.code ?? error?.data?.originalError?.code;

      // 4902: Unrecognized chain, needs to be added first
      if (code === 4902) {
        const addParams = {
          chainId: chainIdHex,
          chainName: network.name,
          rpcUrls: [network.rpc],
          nativeCurrency: {
            name: network.symbol || 'ETH',
            symbol: network.symbol || 'ETH',
            decimals: network.decimals ?? 18,
          },
        };

        if (network.explorer) {
          addParams.blockExplorerUrls = [network.explorer];
        }

        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [addParams],
        });

        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });

        NetworkConfig.setNetwork(Number(network.chainId));
        return true;
      }

      console.error('[ContractService] switchNetwork error:', error);
      throw error;
    }
  }

  // ==================== FIELD OPERATIONS ====================

  /**
   * Create new field (Admin only)
   * @param {Contract} contract - Contract instance
   * @param {string} name - Field name
   * @param {BigInt} pricePerHour - Price in Wei
   * @returns {Object} Transaction receipt
   */
  static async createField(contract, name, pricePerHour) {
    try {
      console.log('[ContractService] createField()', { name, pricePerHour });
      
      const tx = await contract.createField(name, pricePerHour);
      const receipt = await tx.wait();
      
      console.log('[ContractService] ✅ Field created successfully');
      return receipt;
    } catch (error) {
      console.error('[ContractService] createField error:', error);
      throw error;
    }
  }

  /**
   * Update field price
   * @param {Contract} contract - Contract instance
   * @param {number} fieldId - Field ID
   * @param {BigInt} newPrice - New price in Wei
   * @returns {Object} Transaction receipt
   */
  static async updateFieldPrice(contract, fieldId, newPrice) {
    try {
      console.log('[ContractService] updateFieldPrice()', { fieldId, newPrice });
      
      const tx = await contract.updateFieldPrice(fieldId, newPrice);
      const receipt = await tx.wait();
      
      console.log('[ContractService] ✅ Field price updated');
      return receipt;
    } catch (error) {
      console.error('[ContractService] updateFieldPrice error:', error);
      throw error;
    }
  }

  /**
   * Toggle field active status
   * @param {Contract} contract - Contract instance
   * @param {number} fieldId - Field ID
   * @returns {Object} Transaction receipt
   */
  static async toggleFieldStatus(contract, fieldId) {
    try {
      console.log('[ContractService] toggleFieldStatus()', { fieldId });
      
      const tx = await contract.toggleFieldStatus(fieldId);
      const receipt = await tx.wait();
      
      console.log('[ContractService] ✅ Field status toggled');
      return receipt;
    } catch (error) {
      console.error('[ContractService] toggleFieldStatus error:', error);
      throw error;
    }
  }

  /**
   * Get all fields
   * @param {Contract} contract - Contract instance
   * @returns {Array} Array of fields with parsed data
   */
  static async getAllFields(contract) {
    try {
      console.log('[ContractService] getAllFields() called');

      this._requireMethod(contract, 'getFields');
      
      const fields = await contract.getFields();
      
      // Parse fields with safe property access
      const parsedFields = fields.map((field, index) => ({
        id: Number(field.id),
        name: field.name || `Field ${field.id}`,
        pricePerHour: ethers.formatEther(field.pricePerHour),
        pricePerHourWei: field.pricePerHour.toString(),
        isActive: field.isActive,
        owner: field.owner,
        createdAt: Number(field.createdAt),
        ownerShort: field.owner ? `${field.owner.slice(0, 8)}...${field.owner.slice(-4)}` : 'Unknown'
      }));
      
      console.log('[ContractService] ✅ Retrieved', parsedFields.length, 'fields');
      return parsedFields;
    } catch (error) {
      console.error('[ContractService] getAllFields error:', error);
      throw error;
    }
  }

  /**
   * Get single field by ID
   * @param {Contract} contract - Contract instance
   * @param {number} fieldId - Field ID
   * @returns {Object} Field object
   */
  static async getField(contract, fieldId) {
    try {
      const field = await contract.getField(fieldId);
      
      return {
        id: Number(field.id),
        name: field.name,
        pricePerHour: ethers.formatEther(field.pricePerHour),
        pricePerHourWei: field.pricePerHour.toString(),
        isActive: field.isActive,
        owner: field.owner,
        createdAt: Number(field.createdAt),
      };
    } catch (error) {
      console.error('[ContractService] getField error:', error);
      throw error;
    }
  }

  /**
   * Get fields with statistics
   * @param {Contract} contract - Contract instance
   * @returns {Array} Fields with booking count and revenue
   */
  static async getFieldsWithStats(contract) {
    try {
      console.log('[ContractService] getFieldsWithStats() called');

      this._requireMethod(contract, 'getFields');
      
      const fields = await contract.getFields();
      const fieldsWithStats = [];

      for (const field of fields) {
        if (field.id === 0n) continue; // Skip deleted fields

        const fieldId = Number(field.id);
        const bookings = await contract.getFieldBookings(fieldId);
        
        // Calculate statistics
        let bookingCount = 0;
        let totalRevenue = 0n;

        for (const booking of bookings) {
          // Count only non-cancelled bookings
          if (booking.status !== 2n) { // 2 = Cancelled
            bookingCount++;
            // Add amount paid to revenue (before fee split)
            totalRevenue += booking.amountPaid;
          }
        }

        fieldsWithStats.push({
          id: fieldId,
          name: field.name || `Field ${fieldId}`,
          pricePerHour: ethers.formatEther(field.pricePerHour),
          pricePerHourWei: field.pricePerHour.toString(),
          isActive: field.isActive,
          owner: field.owner,
          bookingCount,
          revenue: ethers.formatEther(totalRevenue),
          revenueWei: totalRevenue.toString(),
          ownerShort: field.owner ? `${field.owner.slice(0, 8)}...${field.owner.slice(-4)}` : 'Unknown'
        });
      }

      console.log('[ContractService] ✅ Retrieved fields with stats');
      return fieldsWithStats;
    } catch (error) {
      console.error('[ContractService] getFieldsWithStats error:', error);
      throw error;
    }
  }

  // ==================== BOOKING OPERATIONS ====================

  /**
   * Book a field
   * @param {Contract} contract - Contract instance
   * @param {number} fieldId - Field ID
   * @param {number} startTime - Start time (unix timestamp)
   * @param {number} endTime - End time (unix timestamp)
   * @param {BigInt} value - Amount in Wei to send
   * @returns {Object} Transaction receipt
   */
  static async bookField(contract, fieldId, startTime, endTime, value) {
    try {
      console.log('[ContractService] bookField()', { fieldId, startTime, endTime, value });
      
      const tx = await contract.bookField(fieldId, startTime, endTime, {
        value: value
      });
      const receipt = await tx.wait();
      
      console.log('[ContractService] ✅ Booking created');
      return receipt;
    } catch (error) {
      console.error('[ContractService] bookField error:', error);
      throw error;
    }
  }

  /**
   * Confirm pending booking (Admin only)
   * @param {Contract} contract - Contract instance
   * @param {number} bookingId - Booking ID
   * @returns {Object} Transaction receipt
   */
  static async confirmBooking(contract, bookingId) {
    try {
      console.log('[ContractService] confirmBooking()', { bookingId });
      
      const tx = await contract.confirmBooking(bookingId);
      const receipt = await tx.wait();
      
      console.log('[ContractService] ✅ Booking confirmed');
      return receipt;
    } catch (error) {
      console.error('[ContractService] confirmBooking error:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   * @param {Contract} contract - Contract instance
   * @param {number} bookingId - Booking ID
   * @returns {Object} Transaction receipt
   */
  static async cancelBooking(contract, bookingId) {
    try {
      console.log('[ContractService] cancelBooking()', { bookingId });
      
      const tx = await contract.cancelBooking(bookingId);
      const receipt = await tx.wait();
      
      console.log('[ContractService] ✅ Booking cancelled');
      return receipt;
    } catch (error) {
      console.error('[ContractService] cancelBooking error:', error);
      throw error;
    }
  }

  /**
   * Get bookings for a user
   * @param {Contract} contract - Contract instance
   * @param {string} userAddress - User wallet address
   * @returns {Array} Array of bookings
   */
  static async getUserBookings(contract, userAddress) {
    try {
      console.log('[ContractService] getUserBookings()', { userAddress });
      
      const bookings = await contract.getUserBookings(userAddress);
      
      const parsedBookings = bookings.map(booking => ({
        id: Number(booking.id),
        fieldId: Number(booking.fieldId),
        user: booking.user,
        startTime: Number(booking.startTime),
        endTime: Number(booking.endTime),
        amountPaid: ethers.formatEther(booking.amountPaid),
        amountPaidWei: booking.amountPaid.toString(),
        status: Number(booking.status),
        statusName: this.getBookingStatusName(Number(booking.status)),
        createdAt: Number(booking.createdAt),
      }));
      
      console.log('[ContractService] ✅ Retrieved', parsedBookings.length, 'user bookings');
      return parsedBookings;
    } catch (error) {
      console.error('[ContractService] getUserBookings error:', error);
      throw error;
    }
  }

  /**
   * Get all bookings for a field
   * @param {Contract} contract - Contract instance
   * @param {number} fieldId - Field ID
   * @returns {Array} Array of bookings for field
   */
  static async getFieldBookings(contract, fieldId) {
    try {
      console.log('[ContractService] getFieldBookings()', { fieldId });
      
      const bookings = await contract.getFieldBookings(fieldId);
      
      const parsedBookings = bookings.map(booking => ({
        id: Number(booking.id),
        fieldId: Number(booking.fieldId),
        user: booking.user,
        userShort: `${booking.user.slice(0, 8)}...${booking.user.slice(-4)}`,
        startTime: Number(booking.startTime),
        endTime: Number(booking.endTime),
        amountPaid: ethers.formatEther(booking.amountPaid),
        amountPaidWei: booking.amountPaid.toString(),
        status: Number(booking.status),
        statusName: this.getBookingStatusName(Number(booking.status)),
        createdAt: Number(booking.createdAt),
      }));
      
      console.log('[ContractService] ✅ Retrieved', parsedBookings.length, 'field bookings');
      return parsedBookings;
    } catch (error) {
      console.error('[ContractService] getFieldBookings error:', error);
      throw error;
    }
  }

  /**
   * Check for time conflicts
   * @param {Contract} contract - Contract instance
   * @param {number} fieldId - Field ID
   * @param {number} startTime - Start time (unix timestamp)
   * @param {number} endTime - End time (unix timestamp)
   * @returns {boolean} True if conflict exists
   */
  static async hasTimeConflict(contract, fieldId, startTime, endTime) {
    try {
      const hasConflict = await contract.hasTimeConflict(fieldId, startTime, endTime);
      console.log('[ContractService] hasTimeConflict()', { fieldId, startTime, endTime, hasConflict });
      return hasConflict;
    } catch (error) {
      console.error('[ContractService] hasTimeConflict error:', error);
      throw error;
    }
  }

  // ==================== PAYMENT OPERATIONS ====================

  /**
   * Get owner's balance to withdraw
   * @param {Contract} contract - Contract instance
   * @param {string} ownerAddress - Owner wallet address
   * @returns {string} Balance in ETH
   */
  static async getBalance(contract, ownerAddress) {
    try {
      const balance = await contract.getBalance(ownerAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('[ContractService] getBalance error:', error);
      throw error;
    }
  }

  /**
   * Withdraw owner balance
   * @param {Contract} contract - Contract instance
   * @returns {Object} Transaction receipt
   */
  static async withdrawBalance(contract) {
    try {
      console.log('[ContractService] withdrawBalance() called');
      
      const tx = await contract.withdrawBalance();
      const receipt = await tx.wait();
      
      console.log('[ContractService] ✅ Balance withdrawn');
      return receipt;
    } catch (error) {
      console.error('[ContractService] withdrawBalance error:', error);
      throw error;
    }
  }

  // ==================== QUERY OPERATIONS ====================

  /**
   * Get pending bookings count
   * @param {Contract} contract - Contract instance
   * @returns {number} Count of pending bookings
   */
  static async getPendingBookingsCount(contract) {
    try {
      const count = await contract.getPendingBookingsCount();
      return Number(count);
    } catch (error) {
      console.error('[ContractService] getPendingBookingsCount error:', error);
      throw error;
    }
  }

  /**
   * Get contract statistics
   * @param {Contract} contract - Contract instance
   * @returns {Object} { totalFields, totalBookings, contractBalance }
   */
  static async getContractStats(contract) {
    try {
      const [totalFields, totalBookings, contractBalance] = await contract.getContractStats();
      
      return {
        totalFields: Number(totalFields),
        totalBookings: Number(totalBookings),
        contractBalance: ethers.formatEther(contractBalance),
        contractBalanceWei: contractBalance.toString(),
      };
    } catch (error) {
      console.error('[ContractService] getContractStats error:', error);
      throw error;
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  /**
   * Get booking status name
   * @param {number} status - Status code (0, 1, 2)
   * @returns {string} Status name
   */
  static getBookingStatusName(status) {
    const statusMap = {
      0: 'Chờ xác nhận',
      1: 'Đã xác nhận',
      2: 'Đã huỷ'
    };
    return statusMap[status] || 'Không xác định';
  }

  /**
   * Format timestamp to readable date
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted date string
   */
  static formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString('vi-VN');
  }

  /**
   * Calculate booking duration in hours
   * @param {number} startTime - Start time (unix timestamp)
   * @param {number} endTime - End time (unix timestamp)
   * @returns {number} Duration in hours
   */
  static calculateDurationHours(startTime, endTime) {
    return (endTime - startTime) / 3600;
  }

  // ==================== ADMIN STATISTICS (ADMIN ONLY) ====================

  /**
   * Get admin dashboard summary
   * @param {Contract} contract - Contract instance
   * @returns {Object} Admin summary stats
   */
  static async getAdminSummary(contract) {
    try {
      const [totalFields, totalBookings, totalRevenue, adminBalance, contractTotalBalance] = 
        await contract.getAdminSummary();

      return {
        totalFields: Number(totalFields),
        totalBookings: Number(totalBookings),
        totalRevenue: ethers.formatEther(totalRevenue),
        totalRevenueWei: totalRevenue.toString(),
        adminBalance: ethers.formatEther(adminBalance),
        adminBalanceWei: adminBalance.toString(),
        contractTotalBalance: ethers.formatEther(contractTotalBalance),
        contractTotalBalanceWei: contractTotalBalance.toString(),
      };
    } catch (error) {
      console.error('[ContractService] getAdminSummary error:', error);
      throw error;
    }
  }

  /**
   * Get revenue for a specific day
   * @param {Contract} contract - Contract instance
   * @param {number} date - Unix timestamp of any time in the day
   * @returns {string} Daily revenue in ETH
   */
  static async getDailyRevenue(contract, date) {
    try {
      const revenue = await contract.getDailyRevenue(date);
      return {
        dailyRevenue: ethers.formatEther(revenue),
        dailyRevenueWei: revenue.toString(),
      };
    } catch (error) {
      console.error('[ContractService] getDailyRevenue error:', error);
      throw error;
    }
  }

  /**
   * Get total revenue for a specific field
   * @param {Contract} contract - Contract instance
   * @param {number} fieldId - Field ID
   * @returns {Object} Field revenue data
   */
  static async getFieldRevenue(contract, fieldId) {
    try {
      const revenue = await contract.getFieldRevenue(fieldId);
      return {
        fieldId,
        fieldRevenue: ethers.formatEther(revenue),
        fieldRevenueWei: revenue.toString(),
      };
    } catch (error) {
      console.error('[ContractService] getFieldRevenue error:', error);
      throw error;
    }
  }

  /**
   * Get booking count for a field
   * @param {Contract} contract - Contract instance
   * @param {number} fieldId - Field ID
   * @returns {Object} Field booking count
   */
  static async getFieldBookingCount(contract, fieldId) {
    try {
      const count = await contract.getFieldBookingCount(fieldId);
      return {
        fieldId,
        bookingCount: Number(count),
      };
    } catch (error) {
      console.error('[ContractService] getFieldBookingCount error:', error);
      throw error;
    }
  }

  /**
   * Get most booked field
   * @param {Contract} contract - Contract instance
   * @returns {Object} Most booked field details
   */
  static async getMostBookedField(contract) {
    try {
      const [fieldId, bookingCount] = await contract.getMostBookedField();
      return {
        fieldId: Number(fieldId),
        bookingCount: Number(bookingCount),
      };
    } catch (error) {
      console.error('[ContractService] getMostBookedField error:', error);
      throw error;
    }
  }

  /**
   * Get field statistics
   * @param {Contract} contract - Contract instance
   * @param {number} fieldId - Field ID
   * @returns {Object} Field statistics
   */
  static async getFieldStats(contract, fieldId) {
    try {
      const [fieldName, pricePerHour, isActive, totalBookings, totalRevenue] = 
        await contract.getFieldStats(fieldId);

      return {
        fieldId,
        fieldName,
        pricePerHour: ethers.formatEther(pricePerHour),
        pricePerHourWei: pricePerHour.toString(),
        isActive,
        totalBookings: Number(totalBookings),
        totalRevenue: ethers.formatEther(totalRevenue),
        totalRevenueWei: totalRevenue.toString(),
      };
    } catch (error) {
      console.error('[ContractService] getFieldStats error:', error);
      throw error;
    }
  }

  /**
   * Get top N highest-revenue fields (fetches all fields and sorts)
   * @param {Contract} contract - Contract instance
   * @param {number} limit - Number of fields to return
   * @returns {Array} Top fields by revenue
   */
  static async getTopFields(contract, limit = 10) {
    try {
      this._requireMethod(contract, 'getFields');
      const fields = await contract.getFields();
      const fieldStatsPromises = fields.map(field => 
        this.getFieldStats(contract, field.id)
      );
      const allStats = await Promise.all(fieldStatsPromises);
      
      // Sort by revenue and return top N
      const sorted = allStats.sort((a, b) => 
        parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue)
      );
      
      return sorted.slice(0, limit);
    } catch (error) {
      console.error('[ContractService] getTopFields error:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for admin notifications
   * @param {BrowserProvider} provider - Ethers provider
   * @param {string} contractAddress - Contract address
   * @param {Function} onBookingPaymentReceived - Callback for BookingPaymentReceived events
   * @param {Function} onAdminWithdrawal - Callback for AdminWithdrawal events
   * @returns {Object} Event listeners for cleanup
   */
  static setupAdminEventListeners(provider, contractAddress, onBookingPaymentReceived, onAdminWithdrawal, onBookingCreated) {
    try {
      if (!contractAddress || !ethers.isAddress(contractAddress)) {
        throw new Error(
          'Contract address không hợp lệ (null/undefined hoặc sai định dạng). ' +
          'Hãy đăng nhập lại ví hoặc cấu hình REACT_APP_CONTRACT_ADDRESS đúng.'
        );
      }

      const contract = new ethers.Contract(
        contractAddress,
        FIELD_BOOKING_ABI,
        provider
      );

      // Listen for BookingCreated events (payment goes into contract at booking time)
      if (onBookingCreated) {
        contract.on('BookingCreated', (bookingId, fieldId, user, startTime, endTime, amount) => {
          onBookingCreated({
            bookingId: Number(bookingId),
            fieldId: Number(fieldId),
            user,
            startTime: Number(startTime),
            endTime: Number(endTime),
            amount: ethers.formatEther(amount),
          });
        });
      }

      // Listen for BookingPaymentReceived events
      if (onBookingPaymentReceived) {
        contract.on('BookingPaymentReceived', (bookingId, fieldId, user, amount, adminEarnings, timestamp) => {
          onBookingPaymentReceived({
            bookingId: Number(bookingId),
            fieldId: Number(fieldId),
            user,
            amount: ethers.formatEther(amount),
            adminEarnings: ethers.formatEther(adminEarnings),
            timestamp: Number(timestamp),
          });
        });
      }

      // Listen for AdminWithdrawal events
      if (onAdminWithdrawal) {
        contract.on('AdminWithdrawal', (admin, amount, newBalance, timestamp) => {
          onAdminWithdrawal({
            admin,
            amount: ethers.formatEther(amount),
            newBalance: ethers.formatEther(newBalance),
            timestamp: Number(timestamp),
          });
        });
      }

      return {
        removeBookingCreatedListener: () => contract.removeAllListeners('BookingCreated'),
        removeBookingPaymentListener: () => contract.removeAllListeners('BookingPaymentReceived'),
        removeAdminWithdrawalListener: () => contract.removeAllListeners('AdminWithdrawal'),
        removeAllListeners: () => contract.removeAllListeners(),
      };
    } catch (error) {
      console.error('[ContractService] setupAdminEventListeners error:', error);
      throw error;
    }
  }
}

export default ContractService;

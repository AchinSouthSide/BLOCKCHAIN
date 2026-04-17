import { ethers } from 'ethers';
import { FIELD_BOOKING_ABI } from './abi/index.js';

class ContractService {
  static async connectWallet() {
    console.log('[ContractService] connectWallet() called');
    
    if (!window.ethereum) {
      console.error('[ContractService] window.ethereum not found');
      throw new Error('MetaMask chưa được cài đặt. Vui lòng cài MetaMask extension.');
    }

    try {
      console.log('[ContractService] Requesting accounts...');
      
      // Request account access - This will show MetaMask popup
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('Không nhận được account từ MetaMask');
      }
      
      console.log('[ContractService] Accounts granted:', accounts);
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      console.log('[ContractService] Signer created');
      
      // Check network
      const network = await provider.getNetwork();
      console.log('[ContractService] Network:', network.name, '- Chain ID:', network.chainId);
      
      const contractAddress = window.location.hostname === 'localhost' 
        ? process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
        : process.env.REACT_APP_CONTRACT_ADDRESS;
      
      console.log('[ContractService] Contract Address:', contractAddress);

      const contract = new ethers.Contract(
        contractAddress,
        FIELD_BOOKING_ABI,
        signer
      );
      
      console.log('[ContractService] Contract created successfully');

      return {
        isConnected: true,
        address: accounts[0],
        provider,
        signer,
        contract,
        network: network.name
      };
    } catch (error) {
      console.error('[ContractService] Connection error:', error);
      
      // Provide user-friendly error messages
      if (error.code === -32602) {
        throw new Error('Lỗi tham số RPC. Vui lòng kiểm tra cấu hình MetaMask.');
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Lỗi kết nối mạng. Kiểm tra Hardhat node có chạy không?');
      } else {
        throw error;
      }
    }
  }

  static async getAllFields(contract) {
    try {
      const fieldCounter = await contract.fieldCounter();
      const fields = [];

      for (let i = 1; i <= fieldCounter; i++) {
        try {
          const field = await contract.getField(i);
          if (field.id !== 0) {
            fields.push({
              ...field,
              id: Number(field.id),
              pricePerHour: ethers.formatEther(field.pricePerHour)
            });
          }
        } catch (error) {
          // Skip fields that can't be retrieved
        }
      }

      return fields;
    } catch (error) {
      console.error('Error fetching fields:', error);
      throw error;
    }
  }

  static async getUserBookings(contract, userAddress) {
    try {
      const bookingIds = await contract.getUserBookings(userAddress);
      const bookings = [];

      for (const bookingId of bookingIds) {
        try {
          const booking = await contract.getBooking(bookingId);
          if (booking.id !== 0) {
            bookings.push({
              ...booking,
              id: Number(booking.id),
              fieldId: Number(booking.fieldId),
              totalPrice: ethers.formatEther(booking.totalPrice),
              startTime: Number(booking.startTime),
              endTime: Number(booking.endTime)
            });
          }
        } catch (error) {
          // Skip bookings that can't be retrieved
        }
      }

      return bookings;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  }

  static async createField(contract, name, location, description, pricePerHour) {
    try {
      const tx = await contract.createField(
        name,
        location,
        description,
        ethers.parseEther(pricePerHour.toString())
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error creating field:', error);
      throw error;
    }
  }

  static async createBooking(contract, fieldId, startTime, endTime, totalPrice) {
    try {
      const tx = await contract.createBooking(
        fieldId,
        startTime,
        endTime,
        { 
          value: ethers.parseEther(totalPrice.toString())
        }
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  static async confirmBooking(contract, bookingId) {
    try {
      const tx = await contract.confirmBooking(bookingId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  }

  static async checkIn(contract, bookingId) {
    try {
      const tx = await contract.checkIn(bookingId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  }

  static async cancelBooking(contract, bookingId) {
    try {
      const tx = await contract.cancelBooking(bookingId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  static async completeBooking(contract, bookingId) {
    try {
      const tx = await contract.completeBooking(bookingId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    }
  }

  static async refundBooking(contract, bookingId) {
    try {
      const tx = await contract.refundBooking(bookingId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error refunding booking:', error);
      throw error;
    }
  }

  static async updateField(contract, fieldId, name, location, description, pricePerHour) {
    try {
      const tx = await contract.updateField(
        fieldId,
        name,
        location,
        description,
        ethers.parseEther(pricePerHour.toString())
      );
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error updating field:', error);
      throw error;
    }
  }

  static async toggleFieldStatus(contract, fieldId) {
    try {
      const tx = await contract.toggleFieldStatus(fieldId);
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error toggling field status:', error);
      throw error;
    }
  }

  static async getFieldBookings(contract, fieldId) {
    try {
      const bookingIds = await contract.getFieldBookings(fieldId);
      const bookings = [];

      for (const bookingId of bookingIds) {
        try {
          const booking = await contract.getBooking(bookingId);
          if (booking.id !== 0) {
            bookings.push({
              ...booking,
              id: Number(booking.id),
              fieldId: Number(booking.fieldId),
              totalPrice: ethers.formatEther(booking.totalPrice),
              startTime: Number(booking.startTime),
              endTime: Number(booking.endTime)
            });
          }
        } catch (error) {
          // Skip bookings that can't be retrieved
        }
      }

      return bookings;
    } catch (error) {
      console.error('Error fetching field bookings:', error);
      throw error;
    }
  }

  static async withdraw(contract) {
    try {
      const tx = await contract.withdraw();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error withdrawing earnings:', error);
      throw error;
    }
  }

  static async withdrawPlatformFee(contract) {
    try {
      const tx = await contract.withdrawPlatformFee();
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Error withdrawing platform fee:', error);
      throw error;
    }
  }

  static async getOwnerEarnings(contract, ownerAddress) {
    try {
      const earnings = await contract.ownerEarnings(ownerAddress);
      return ethers.formatEther(earnings);
    } catch (error) {
      console.error('Error fetching owner earnings:', error);
      throw error;
    }
  }

  static async getPlatformEarnings(contract) {
    try {
      const earnings = await contract.platformEarnings();
      return ethers.formatEther(earnings);
    } catch (error) {
      console.error('Error fetching platform earnings:', error);
      throw error;
    }
  }

  static async getOwnerFields(contract, ownerAddress) {
    try {
      const fieldCounter = await contract.fieldCounter();
      const fields = [];

      for (let i = 1; i <= fieldCounter; i++) {
        try {
          const field = await contract.getField(i);
          if (field.id !== 0 && field.owner.toLowerCase() === ownerAddress.toLowerCase()) {
            fields.push({
              ...field,
              id: Number(field.id),
              pricePerHour: ethers.formatEther(field.pricePerHour)
            });
          }
        } catch (error) {
          // Skip fields that can't be retrieved
        }
      }

      return fields;
    } catch (error) {
      console.error('Error fetching owner fields:', error);
      throw error;
    }
  }
}

export default ContractService;

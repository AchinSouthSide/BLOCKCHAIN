import { ethers } from 'ethers';
import CONTRACT_ABI from './abi/FieldBooking.json';

class ContractService {
  static async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check network
      const network = await provider.getNetwork();
      const contractAddress = window.location.hostname === 'localhost' 
        ? process.env.REACT_APP_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
        : process.env.REACT_APP_CONTRACT_ADDRESS;

      const contract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        signer
      );

      return {
        isConnected: true,
        address: accounts[0],
        provider,
        signer,
        contract,
        network: network.name
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
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
}

export default ContractService;

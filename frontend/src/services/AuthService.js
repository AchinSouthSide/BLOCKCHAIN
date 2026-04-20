/**
 * Authentication Service
 * Quản lý đăng nhập, đăng xuất và user roles
 */

class AuthService {
  static STORAGE_KEY = 'fieldBooking_currentUser';
  static SESSION_KEY = 'fieldBooking_session';
  static contractInstance = null;
  static provider = null;
  static signer = null;

  /**
   * Đăng nhập user
   * @param {string} address - Wallet address từ MetaMask
   * @param {string} role - 'admin' hoặc 'user'
   * @param {Object} contractData - { contract, provider, signer, address: contractAddress }
   */
  static login(address, role = 'user', contractData = {}) {
    console.log('[AuthService] Login:', { address, role });
    
    const user = {
      address,
      role, // 'admin' || 'user'
      loginTime: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      isLoggedIn: true,
    };

    // Lưu contract instance in memory (không serialize)
    this.contractInstance = contractData.contract;
    this.provider = contractData.provider;
    this.signer = contractData.signer;

    // Lưu non-serializable data
    const sessionData = {
      contractAddress: contractData.address || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      network: contractData.network,
      userAddress: address
    };

    // Persist user so reload doesn't lose session
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));

    console.log('[AuthService] User logged in successfully');
    return user;
  }

  /**
   * Đăng xuất user - Complete reset
   */
  static logout() {
    console.log('[AuthService] Logout - Complete reset');
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
    
    // COMPLETELY clear all contract/provider/signer state
    this.contractInstance = null;
    this.provider = null;
    this.signer = null;
    
    console.log('[AuthService] ✅ All state cleared - ready for fresh login');
  }

  /**
   * Lấy current user
   */
  static getCurrentUser() {
    try {
      const userStr = localStorage.getItem(this.STORAGE_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('[AuthService] Error getting current user:', error);
      return null;
    }
  }

  /**
   * Lấy session contract data
   */
  static getSessionData() {
    try {
      const dataStr = sessionStorage.getItem(this.SESSION_KEY);
      const data = dataStr ? JSON.parse(dataStr) : null;
      
      if (data) {
        // Return contract instance from memory
        data.contract = this.contractInstance;
      }
      
      return data;
    } catch (error) {
      console.error('[AuthService] Error getting session data:', error);
      return null;
    }
  }

  /**
   * Lấy contract instance
   */
  static getContract() {
    if (!this.contractInstance) {
      console.warn('[AuthService] Contract instance not found');
    }
    return this.contractInstance;
  }

  /**
   * Lấy provider instance
   */
  static getProvider() {
    if (!this.provider) {
      console.warn('[AuthService] Provider instance not found');
    }
    return this.provider;
  }

  /**
   * Check user đã đăng nhập chưa
   */
  static isLoggedIn() {
    const user = this.getCurrentUser();
    return user && user.isLoggedIn;
  }

  /**
   * Check user là admin
   */
  static isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }

  /**
   * Check user là user bình thường
   */
  static isUser() {
    const user = this.getCurrentUser();
    return user && user.role === 'user';
  }

  /**
   * Check role (role-based access)
   */
  static hasRole(requiredRole) {
    const user = this.getCurrentUser();
    if (!user) return false;

    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    return user.role === requiredRole;
  }

  /**
   * Set user role
   */
  static setRole(role) {
    const user = this.getCurrentUser();
    if (user) {
      user.role = role;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      console.log('[AuthService] Role updated to:', role);
    }
  }

  /**
   * Generate unique session ID
   */
  static generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check session timeout
   */
  static isSessionExpired(maxDuration = 24 * 60 * 60 * 1000) {
    const user = this.getCurrentUser();
    if (!user || !user.loginTime) return true;

    const loginTime = new Date(user.loginTime).getTime();
    const now = new Date().getTime();
    return (now - loginTime) > maxDuration;
  }

  /**
   * Clear all auth data
   */
  static clearAll() {
    console.log('[AuthService] Clearing all auth data');
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  /**
   * Get user info display
   */
  static getUserDisplay() {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      address: user.address,
      shortAddress: `${user.address.substring(0, 6)}...${user.address.substring(38)}`,
      role: user.role,
      roleDisplay: user.role === 'admin' ? '👨‍💼 Admin' : '👤 User',
    };
  }
}

export default AuthService;

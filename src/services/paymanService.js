// Payman API integration service
// Uncommented for production with the SDK
import { PaymanClient } from "@paymanai/payman-ts";

// Store client instance
let paymanClient = null;

// Initialize the Payman client with credentials from environment variables
export const initializePaymanClient = () => {
  try {
    const clientId = import.meta.env.VITE_PAYMAN_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_PAYMAN_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn("Payman client credentials missing from environment variables");
      return false;
    }
    
    // Using the real Payman SDK for production
    paymanClient = PaymanClient.withClientCredentials({
      clientId,
      clientSecret,
    });
    console.log("Payman client initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Payman client:", error);
    return false;
  }
};

// Create a TSD payee with the given name
export const createTsdPayee = async (userName) => {
  if (!paymanClient) {
    throw new Error("Payman client not initialized");
  }

  try {
    console.log(`Creating TSD payee for: ${userName}`);
    
    const response = await paymanClient.ask(`create a new TSD payee named ${userName}`, {
      metadata: {
        source: "yoga_challenge_app",
        action: "create_payee",
        timestamp: new Date().toISOString()
      },
    });
    
    console.log("Payee created successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to create TSD payee:", error);
    throw error;
  }
};

// Send TSD reward to the payee
export const sendTsdReward = async (userName, amount = 30) => {
  if (!paymanClient) {
    throw new Error("Payman client not initialized");
  }

  try {
    console.log(`Sending ${amount} TSD to payee: ${userName}`);
    
    const response = await paymanClient.ask(`send ${amount} TSD to ${userName}`, {
      metadata: {
        source: "yoga_challenge_app",
        action: "send_reward",
        amount,
        timestamp: new Date().toISOString()
      },
    });
    
    console.log("Reward sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Failed to send TSD reward:", error);
    throw error;
  }
};

// Complete reward flow: create payee and send reward
export const processReward = async (userName, amount = 30) => {
  const MAX_RETRIES = 2;
  let attempts = 0;
  
  while (attempts <= MAX_RETRIES) {
    try {
      attempts++;
      console.log(`Processing reward - Attempt ${attempts}/${MAX_RETRIES + 1}`);
      
      // Step 1: Create the payee
      console.log("Step 1: Creating TSD payee");
      await createTsdPayee(userName);
      
      // Step 2: Send the reward
      console.log("Step 2: Sending TSD reward");
      const result = await sendTsdReward(userName, amount);
      
      console.log("Reward process completed successfully");
      return {
        success: true,
        message: `Successfully sent ${amount} TSD to ${userName}`,
        result,
      };
    } catch (error) {
      console.error(`Attempt ${attempts} failed:`, error);
      
      // If we're out of retries, give up
      if (attempts > MAX_RETRIES) {
        console.error("All retry attempts failed");
        return {
          success: false,
          message: `Failed to process reward: ${error.message}`,
          error,
        };
      }
      
      // Wait a bit before retrying (exponential backoff)
      const backoffTime = Math.pow(2, attempts) * 500; // 1s, 2s, 4s...
      console.log(`Retrying in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
};

// Mock implementation for development without actual Payman credentials
export const mockProcessReward = async (userName, amount = 30) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log(`MOCK: Creating TSD payee for ${userName} and sending ${amount} TSD`);
  
  return {
    success: true,
    message: `Successfully sent ${amount} TSD to ${userName}`,
    result: {
      transaction: {
        id: "mock-transaction-" + Math.floor(Math.random() * 1000),
        status: "completed",
        amount,
        recipient: userName,
      }
    }
  };
};

// Test function to directly check Payman integration
export const testPaymanConnection = async () => {
  try {
    console.log("Testing Payman connection...");
    
    // Initialize client
    const initResult = initializePaymanClient();
    if (!initResult) {
      return { success: false, message: "Failed to initialize Payman client" };
    }
    
    // Test API connection
    if (!paymanClient) {
      return { success: false, message: "Payman client not available" };
    }
    
    // Simple test query
    const response = await paymanClient.ask("list all wallets", {
      metadata: {
        source: "yoga_challenge_app",
        action: "test_connection"
      },
    });
    
    console.log("Payman connection test result:", response);
    return { 
      success: true, 
      message: "Payman connection successful", 
      wallets: response
    };
  } catch (error) {
    console.error("Payman connection test failed:", error);
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
      error
    };
  }
};
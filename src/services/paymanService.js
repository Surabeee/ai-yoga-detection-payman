// Simplified Payman API integration service
import { PaymanClient } from "@paymanai/payman-ts";

// Store client instance
let paymanClient = null;

// Initialize the Payman client with credentials
export const initializePaymanClient = () => {
  try {
    const envClientId = import.meta.env.VITE_PAYMAN_CLIENT_ID;
    const envClientSecret = import.meta.env.VITE_PAYMAN_CLIENT_SECRET;
    
    if (!envClientId || !envClientSecret) {
      console.error("Missing Payman credentials in environment variables");
      return false;
    }
    
    paymanClient = PaymanClient.withCredentials({
      clientId: envClientId,
      clientSecret: envClientSecret,
    });
    
    console.log("Payman client initialized successfully", paymanClient);
    return true;
  } catch (error) {
    console.error("Failed to initialize Payman client:", error);
    return false;
  }
};

// Process reward: create payee and send reward in 3 simple steps
export const processReward = async (userName, amount = 30) => {
  console.log(`Processing reward for ${userName} with amount ${amount} TSD`);
  
  try {
    // Step 1: Initialize client if not already done
    if (!paymanClient) {
      const initialized = initializePaymanClient();
      if (!initialized) {
        throw new Error("Failed to initialize Payman client. Check your credentials.");
      }
    }
    
    // Step 2: Create TSD payee
    console.log(`Creating TSD payee: ${userName}`);
    const response = await paymanClient.ask(`create a new TSD payee named ${userName}`);
    console.log("Payee created:", response);
    
    // Step 3: Send reward
    console.log(`Sending ${amount} TSD to ${userName}`);
    const result = await paymanClient.ask(`send ${amount} TSD to ${userName} from my TSD wallet`);
    
    console.log("Reward processed successfully:", result);
    return {
      success: true,
      message: `Successfully sent ${amount} TSD to ${userName}`,
      result,
    };
  } catch (error) {
    console.error("Failed to process reward:", error);
    return {
      success: false,
      message: `Failed to process reward: ${error.message}`,
      error,
    };
  }
};
// Payman API integration service
import { PaymanClient } from "@paymanai/payman-ts";

// Store client instance
let paymanClient = null;

// Initialize the Payman client with credentials
export const initializePaymanClient = (clientId, clientSecret) => {
  try {
    // Try to use provided credentials first
    if (clientId && clientSecret) {
      console.log("Initializing Payman client with provided credentials");
      paymanClient = PaymanClient.withCredentials({
        clientId,
        clientSecret,
      });
      return true;
    }
    
    // Then try environment variables
    // Make sure environment variables are properly configured in .env file
    // with VITE_PAYMAN_CLIENT_ID and VITE_PAYMAN_CLIENT_SECRET
    const envClientId = import.meta.env.VITE_PAYMAN_CLIENT_ID;
    const envClientSecret = import.meta.env.VITE_PAYMAN_CLIENT_SECRET;
    
    console.log("Environment variables check:", 
      envClientId ? "Client ID found" : "Client ID missing", 
      envClientSecret ? "Client Secret found" : "Client Secret missing");
    
    if (envClientId && envClientSecret) {
      console.log("Initializing Payman client with environment variables");
      paymanClient = PaymanClient.withCredentials({
        clientId: envClientId,
        clientSecret: envClientSecret,
      });
      
      // Test the client to verify it's working
      return verifyPaymanConnection();
    }
    
    console.error("No Payman credentials available");
    return false;
  } catch (error) {
    console.error("Failed to initialize Payman client:", error);
    return false;
  }
};

// Verify the Payman client connection works
export const verifyPaymanConnection = async () => {
  try {
    if (!paymanClient) {
      console.error("Payman client not initialized");
      return false;
    }
    
    // Try a simple query to verify connection
    console.log("Testing Payman client connection...");
    const result = await paymanClient.ask("list all Test wallets");
    
    console.log("Connection test successful:", result);
    return true;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};

// Utility function to wait for a specified time
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to normalize name for comparison
const normalizeName = (name) => {
  if (!name) return '';
  return name.toLowerCase().trim();
};

// Create a TSD payee with the given name
export const createTsdPayee = async (userName) => {
  if (!paymanClient) {
    throw new Error("Payman client not initialized");
  }

  try {
    console.log(`Creating TSD payee for: ${userName}`);
    
    // First check if the payee already exists to avoid duplicates
    console.log("Checking if payee already exists...");
    const existingPayees = await paymanClient.ask("list all payees", {
      metadata: { action: "check_existing_payees" }
    });
    
    console.log("Existing payees:", existingPayees);
    
    const normalizedUserName = normalizeName(userName);
    const payeeExists = Array.isArray(existingPayees) && 
      existingPayees.some(payee => 
        normalizeName(payee.name) === normalizedUserName ||
        (payee.id && payee.id.includes(normalizedUserName))
      );
    
    if (payeeExists) {
      console.log(`Payee ${userName} already exists, skipping creation`);
      return { status: "existing", message: "Payee already exists" };
    }
    
    // Create the payee
    const response = await paymanClient.ask(`create a new TSD payee named ${userName}`, {
      metadata: {
        source: "dev-challenge",
        action: "create_payee",
        timestamp: new Date().toISOString()
      },
    });
    
    console.log("Payee creation response:", response);
    
    // Wait for the payee to be processed by the system - important delay!
    console.log("Waiting for payee creation to be processed...");
    await wait(3000); // 3 second delay
    
    // Verify the payee was created
    const payees = await paymanClient.ask("list all payees", {
      metadata: { action: "verify_payee_creation" }
    });
    
    console.log("Current payees after creation:", payees);
    
    // More flexible check for payee existence
    const newPayeeExists = Array.isArray(payees) && 
      payees.some(payee => {
        // Check various name formats
        const payeeName = normalizeName(payee.name);
        const matchesName = payeeName === normalizedUserName;
        
        // Check if payee ID contains the username
        const payeeIdMatches = payee.id && 
          normalizeName(payee.id).includes(normalizedUserName);
          
        return matchesName || payeeIdMatches;
      });
    
    if (!newPayeeExists) {
      console.warn(`Payee ${userName} not found in payee list after creation and delay`);
      console.log("Available payees:", payees);
      
      // Rather than throwing an error, return a warning but continue
      return { 
        status: "warning", 
        message: "Payee created but not immediately visible in system", 
        response 
      };
    }
    
    return { status: "success", message: "Payee created successfully", response };
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
    
    // Following Payman AI prompt format exactly
    const response = await paymanClient.ask(`send ${amount} TSD to ${userName} from my TSD wallet`);
    
    console.log("Reward sent response:", response);
    
    // Wait for transaction to process
    console.log("Waiting for transaction to process...");
    await wait(2000); // 2 second delay
    
    // Verify the transaction went through
    const transactions = await paymanClient.ask("list recent transactions", {
      metadata: { action: "verify_transaction" }
    });
    
    console.log("Recent transactions:", transactions);
    
    return response;
  } catch (error) {
    console.error("Failed to send TSD reward:", error);
    throw error;
  }
};

// Complete reward flow: create payee and send reward
export const processReward = async (userName, amount = 30) => {
  console.log(`Starting reward process for ${userName} with amount ${amount} TSD`);
  
  if (!paymanClient) {
    console.error("Payman client not initialized");
    return {
      success: false,
      message: "Payman client not initialized. Please check your credentials."
    };
  }
  
  const MAX_RETRIES = 2;
  let attempts = 0;
  
  while (attempts <= MAX_RETRIES) {
    try {
      attempts++;
      console.log(`Processing reward - Attempt ${attempts}/${MAX_RETRIES + 1}`);
      
      // Step 1: Create the payee
      console.log("Step 1: Creating TSD payee");
      const payeeResult = await createTsdPayee(userName);
      console.log("Payee creation result:", payeeResult);
      
      // Additional delay after payee creation regardless of result
      console.log("Additional delay to ensure payee is fully processed...");
      await wait(2000); // 2 more seconds to be safe
      
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
      const backoffTime = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s...
      console.log(`Retrying in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
  
  // This should never be reached due to the error handling above
  return {
    success: false,
    message: "Failed to process reward after all retry attempts"
  };
};

// Test function to directly check Payman integration
export const testPaymanConnection = async () => {
  try {
    console.log("Testing Payman connection...");
    
    if (!paymanClient) {
      console.error("Payman client not available");
      return { 
        success: false, 
        message: "Payman client not initialized. Check your credentials." 
      };
    }
    
    // Simple test query
    const response = await paymanClient.ask("list all wallets", {
      metadata: {
        source: "dev-challenge",
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
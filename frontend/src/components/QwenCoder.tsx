import React, { useState, useEffect } from "react";
import { pixelify_sans } from "@/app/fonts";
import { transform } from "@babel/standalone";

// Define explicit types for components
interface AppHeaderProps {
  page: "landing" | "main";
}

interface LandingProps {
  onStartLending: () => void;
}

const pages = {
  header: `export const AppHeader = ({ page }: { page: "landing" | "main" }) => {
  return (
    <header className="bg-blue-900 text-white p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <img 
          src="/lendchain-logo.svg" 
          alt="LendChain Logo" 
          className="h-10 w-10"
        />
        <h1 className="text-2xl font-bold">LendChain</h1>
      </div>
      <nav className="flex space-x-6">
        <a href="#" className="hover:text-blue-300">Lend</a>
        <a href="#" className="hover:text-blue-300">Borrow</a>
        <a href="#" className="hover:text-blue-300">Dashboard</a>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
          Connect Wallet
        </button>
      </nav>
    </header>
  );
};`,
  
  landing: `export const Landing = ({ onStartLending }: { onStartLending: () => void }) => {
  return (
    <section className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-4xl font-bold text-blue-900 mb-6">
          Secure Lending, Optimized Yields
        </h2>
        <p className="text-lg text-gray-700 mb-8">
          Leverage blockchain technology for transparent, efficient, and secure lending. 
          Get instant loan approvals with dynamic interest rates.
        </p>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={onStartLending}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Start Lending
          </button>
          <button className="bg-gray-200 text-blue-900 px-6 py-3 rounded-lg hover:bg-gray-300">
            Learn More
          </button>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-900">Real-Time Risk Assessment</h3>
            <p className="text-sm text-gray-600">Dynamic interest rates based on real-time market conditions</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-900">Instant Approvals</h3>
            <p className="text-sm text-gray-600">Get loan approvals in seconds with smart contract technology</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-900">Full Transparency</h3>
            <p className="text-sm text-gray-600">Auditable smart contracts ensuring trust and security</p>
          </div>
        </div>
      </div>
    </section>
  );
};`,
  
  main: `export const MainPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-blue-900 mb-8">Lending Dashboard</h2>
        
        <div className="grid grid-cols-3 gap-6">
          {/* Lending Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">Lend Assets</h3>
            <div className="space-y-4">
              <select className="w-full p-2 border rounded-lg">
                <option>Select Asset</option>
                <option>ETH</option>
                <option>USDC</option>
                <option>DAI</option>
              </select>
              <input 
                type="number" 
                placeholder="Enter Amount" 
                className="w-full p-2 border rounded-lg"
              />
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                Supply Liquidity
              </button>
            </div>
          </div>

          {/* Borrowing Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">Borrow Assets</h3>
            <div className="space-y-4">
              <select className="w-full p-2 border rounded-lg">
                <option>Select Collateral</option>
                <option>ETH</option>
                <option>BTC</option>
              </select>
              <input 
                type="number" 
                placeholder="Borrow Amount" 
                className="w-full p-2 border rounded-lg"
              />
              <div className="text-sm text-gray-600">
                Collateralization Ratio: 150%
              </div>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">
                Borrow Now
              </button>
            </div>
          </div>

          {/* Portfolio Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">Your Portfolio</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Supplied</span>
                <span className="font-bold">$5,420.35</span>
              </div>
              <div className="flex justify-between">
                <span>Total Borrowed</span>
                <span className="font-bold">$2,310.75</span>
              </div>
              <div className="flex justify-between">
                <span>Current APY</span>
                <span className="font-bold text-green-600">4.5%</span>
              </div>
              <button className="w-full bg-gray-200 text-blue-900 py-3 rounded-lg hover:bg-gray-300">
                View Full Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};`
};

export const CodeEditor = () => {
  const [customCode, setCustomCode] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  return (
    <div className={`${pixelify_sans.className} h-screen overflow-y-auto p-4`}>
      <div className="space-y-8">
        {Object.entries(pages).map(([page, code]) => (
          <div key={page} className="bg-gray-900 p-4 rounded-lg">
            <h3 className="text-xl text-white mb-4">{page}.tsx</h3>
            <div className="text-green-400 font-mono text-sm">
              <pre className="whitespace-pre-wrap">{code}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Type-safe component creation function
const createComponent = (code: string): React.ComponentType | null => {
  try {
    const transpiled = transform(code, {
      presets: ["react"],
    }).code;

    if (!transpiled) {
      console.error("Transpilation failed: No code generated");
      return null;
    }

    const exports: { [key: string]: any } = {};
    const module = { exports };
    
    const Component = new Function("React", "module", "exports", transpiled);
    Component(React, module, exports);

    // Return the default export or the first exported component
    return module.exports.default || Object.values(module.exports)[0];
  } catch (error) {
    console.error("Component creation error:", error);
    return null;
  }
};

interface CodePreviewProps {
  codeSnippets: {
    header: string;
    landing: string;
    main: string;
  };
}

export const CodePreview: React.FC<CodePreviewProps> = ({ codeSnippets }) => {
  const [components, setComponents] = useState<{
    AppHeader?: React.ComponentType<AppHeaderProps>;
    Landing?: React.ComponentType<LandingProps>;
    MainPage?: React.ComponentType;
  }>({});
  const [currentPage, setCurrentPage] = useState<"landing" | "main">("landing");

  useEffect(() => {
    const loadComponents = async () => {
      const AppHeader = createComponent(codeSnippets.header);
      const Landing = createComponent(codeSnippets.landing);
      const MainPage = createComponent(codeSnippets.main);
      
      setComponents({
        AppHeader: AppHeader as React.ComponentType<AppHeaderProps>,
        Landing: Landing as React.ComponentType<LandingProps>,
        MainPage: MainPage as React.ComponentType
      });
    };

    loadComponents();
  }, [codeSnippets]);

  if (!components.AppHeader || !components.Landing || !components.MainPage) {
    return <div>Loading components...</div>;
  }

  return (
    <div className={`${pixelify_sans.className} h-screen overflow-y-auto p-4`}>
      <components.AppHeader page={currentPage} />
      {currentPage === "landing" ? (
        <components.Landing onStartLending={() => setCurrentPage("main")} />
      ) : (
        <components.MainPage />
      )}
    </div>
  );
};
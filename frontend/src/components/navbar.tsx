import { CustomConnectButton } from "./ConnectButton";

export const NavBar = () => {
  return (
    <nav className="shadow-sm p-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="text-2xl font-bold text-orange-500">Prototype</div>
          <CustomConnectButton />
        </div>
      </div>
    </nav>
  );
};

import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Navbar />
      <div className="flex-grow">{children}</div>
    </div>
  );
};

export default Layout;

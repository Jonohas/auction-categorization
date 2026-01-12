import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components";
import {
  HomePage,
  ScrapingPage,
  AuctionsPage,
  AuctionDetailPage,
  CategoriesPage,
  CategoryDetailPage,
} from "./pages";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/scraping" element={<ScrapingPage />} />
          <Route path="/auctions" element={<AuctionsPage />} />
          <Route path="/auctions/:auctionId" element={<AuctionDetailPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:categoryId" element={<CategoryDetailPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

import { NavBar } from "@/components/NavBar";
import { Hero } from "@/components/Hero";
import { CategoryChips } from "@/components/CategoryChips";
import { MovieCard } from "@/components/MovieCard";
import { ExperiencePromo } from "@/components/ExperiencePromo";
import { Footer } from "@/components/Footer";

const movies = [
  {
    title: "Midnight Echo",
    genre: "Action",
    duration: "2h 15m",
    rating: "4.8",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqGwckytoN4_rnqBi5FvEvo6r_Hj4iGIDAU6-yjd_CZ4DmBQDtzQx2pguEDQ7zmRtxlg9VeWGnIzqAOki6WxwxcBmuaiuTjRu2aeF0ITZLnyO8TyeCjwvGdAEixK3s435JY_eSx6I3q4qXWrF_uz3Y6zbkDAN6VZq8uouwD7pAlxCYsg3qY_Zz1_-WwdkDQtKx8i6HXhWiftXtq9dZWpXulghOcvXcLJs4I95cXwxwuDKlln3Mqgy26MiE2NV2cZEp89t0j28XOf8"
  },
  {
    title: "Stellar Journey",
    genre: "Sci-Fi",
    duration: "2h 45m",
    rating: "4.9",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3Q2t8E0gT-qgNbCUZhIbVO2-Vzr2iKtA3RgA9qvoz8NqFGlUoRZrgGuPNFm75fC4kW9tvYJ4c4uGfra-bIjOJcCRtjOTSZrCNJslbFSEv39rE_jzZod7yKa4kx1cc2wAwzdxeQfuYArpjzPiQAK_82b-PI7RkLwZzh9va3pW77aNbywIvQ7I7P6O5b5zW9Z8NyzJ03m29cRI_dMXiYv6-LAbdXK8_adpcKzSy7FVB44faR4oR8LXGOmXCU6m9VSUYjrLOVNEy-Og"
  },
  {
    title: "The Silent Woods",
    genre: "Thriller",
    duration: "1h 58m",
    rating: "4.5",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHc95qilMXzh3ZeAcevtf8eSfutof8ibOCsyzcyHpMquKEjYVHgKsrtX2JnDXW4gGzhn56Gx8hMXB11onSKPzMgK_B0eeIU44oFoqaCjKZ_VH1YYBrT9c-mQh5rHn-6mhWmD-end54_2098NqE9byInoZ199-U0gWso94fES4O8oavi_O0HqHoEmycYzRjZ4QkLilKrCkgS7syt5hK_7KODuTxfSf3VVBnUB-XG_pS9GYu5I3XaXd9olwrELmXABBCqZD_NQjsaPU"
  },
  {
    title: "Crafty World",
    genre: "Animation",
    duration: "1h 35m",
    rating: "4.7",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGr8EXFBD_o391lFDenx_6yONfIuknjjEX7887uNiJCN4d91s45tkedDnWHycBjot6J1BvzxmQt3cedh9AdCYRq0n61thWT04wrW75_9cBcX3azf7QFdNGAuCpCOmcoSQuL0H1pguuNVlglqK-kQcaeaNn0DbyiCpL28y0J5oU-Rp934UcN9Hojpoe8NuJxTL7kWyUS5cQo201MBnqGXsdDv3coLRLgVYjFn4sAjxIn84nKYgHZJvD9a8IpRxZ9LLo18thg-tBToM"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      
      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-8 py-12">
        <Hero />
        
        <CategoryChips />
        
        <section className="mb-24">
          <h2 className="text-3xl font-headline font-extrabold mb-8 flex items-center gap-4">
            <span className="w-12 h-1 bg-primary rounded-full"></span>
            Trending Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {movies.map((movie) => (
              <MovieCard key={movie.title} {...movie} />
            ))}
          </div>
        </section>

        <ExperiencePromo />
      </main>

      <Footer />
    </div>
  );
}


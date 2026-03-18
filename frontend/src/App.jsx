import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuctionListing from './pages/AuctionListing';
import AuctionDetails from './pages/AuctionDetails';
import CreateRFQ from './pages/CreateRFQ';
import SubmitBid from './pages/SubmitBid';

function App() {
    return (
        <BrowserRouter>
            <Navbar />
            <div style={{ padding: '20px' }}>
                <Routes>
                    <Route path="/" element={<AuctionListing />} />
                    <Route path="/auction/:id" element={<AuctionDetails />} />
                    <Route path="/create" element={<CreateRFQ />} />
                    <Route path="/bid/:rfq_id" element={<SubmitBid />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
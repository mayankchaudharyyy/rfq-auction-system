import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav style={{
            backgroundColor: '#1a1a2e',
            padding: '15px 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '12px'
        }}>

            {/* Logo */}
            <Link to="/" style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: '#e94560',
                fontSize: '20px',
                fontWeight: 'bold',
                textDecoration: 'none'
            }}>
                <img
                    width="40"
                    height="40"
                    src="https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-auction-auction-house-flaticons-flat-flat-icons-2.png"
                    alt="RFQ"
                />
                <span>RFQ Auction</span>
            </Link>

            {/* Right Menu */}
            <div style={{
                display: 'flex',
                gap: '25px',
                alignItems: 'center'
            }}>

                <Link to="/" style={{
                    color: '#fff',
                    textDecoration: 'none'
                }}>
                    Auctions
                </Link>

                <Link to="/create" style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: '#fff',
                    textDecoration: 'none'
                }}>
                    <img
                        width="20"
                        height="20"
                        src="https://img.icons8.com/ios-glyphs/30/FFFFFF/plus--v1.png"
                        alt="Create"
                    />
                    <span>Create RFQ</span>
                </Link>

            </div>
        </nav>
    );
}

export default Navbar;
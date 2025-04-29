// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// const ProductGrid = ({ singleLine = false, isMobile = false }) => {
//   const [products, setProducts] = useState([]);
//   const [windowWidth, setWindowWidth] = useState(window.innerWidth);

//   useEffect(() => {
//     const handleResize = () => setWindowWidth(window.innerWidth);
//     window.addEventListener('resize', handleResize);
    
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // Define mobile breakpoint
//   const mobileView = isMobile || windowWidth < 768;

//   useEffect(() => {
//     fetch('https://nine-ymmn.onrender.com/api/products')
//       .then(response => response.json())
//       .then(data => {
//         const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//         setProducts(sorted.slice(0, 6)); // Get latest 6 products
//       })
//       .catch(error => console.error('Error fetching products:', error));
//   }, []);

//   const getImageFromMedia = (mediaUrls) => {
//     if (Array.isArray(mediaUrls)) {
//       const imageUrl = mediaUrls.find(url =>
//         url.match(/\.(jpeg|jpg|png|gif|webp)$/i)
//       );
//       return imageUrl ? imageUrl : 'https://via.placeholder.com/300x500?text=No+Image';
//     }
//     return 'https://via.placeholder.com/300x500?text=No+Image';
//   };

//   // Adjust styling based on screen size
//   const getStyles = () => {
//     const baseStyles = { ...styles };
    
//     if (mobileView) {
//       // Mobile styles
//       baseStyles.grid = {
//         ...styles.grid,
//         gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
//         gap: '15px',
//         padding: '20px 10px',
//       };
      
//       baseStyles.singleLineContainer = {
//         ...styles.singleLineContainer,
//         gap: '15px',
//         padding: '20px 10px',
//       };
      
//       baseStyles.card = {
//         ...styles.card,
//         padding: '10px',
//         width: '200px',
//       };
      
//       baseStyles.imageWrapper = {
//         ...styles.imageWrapper,
//         height: '270px',
//         width: '180px',
//         marginBottom: '10px',
//       };
      
//       baseStyles.name = {
//         ...styles.name,
//         fontSize: '1rem',
//       };
//     }
    
//     return baseStyles;
//   };
  
//   const currentStyles = getStyles();
  
//   // Use row layout when singleLine is true, otherwise use grid
//   const containerStyle = singleLine
//     ? currentStyles.singleLineContainer
//     : currentStyles.grid;

//   return (
//     <div style={containerStyle}>
//       {products.map(product => (
//         <div
//           key={product.id}
//           style={currentStyles.card}
//           className="product-item"
//         >
//           <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
//             <div style={currentStyles.imageWrapper}>
//               <img
//                 src={getImageFromMedia(product.media_urls)}
//                 alt={product.name}
//                 style={currentStyles.image}
//               />
//             </div>
//           </Link>

//           <h3 style={currentStyles.name}>{product.name}</h3>
//         </div>
//       ))}
//     </div>
//   );
// };

// const styles = {
//   grid: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
//     gap: '30px',
//     padding: '40px 20px',
//   },
//   singleLineContainer: {
//     display: 'flex',
//     flexDirection: 'row',
//     flexWrap: 'nowrap',
//     gap: '30px',
//     padding: '40px 20px',
//   },
//   card: {
//     padding: '20px',
//     textAlign: 'center',
//     boxShadow: 'none',
//     transition: 'transform 0.2s ease',
//     cursor: 'pointer',
//     position: 'relative',
//     overflow: 'hidden',
//     width: '320px',
//     flexShrink: 0,
//   },
//   imageWrapper: {
//     height: '400px',
//     width: '280px',
//     overflow: 'hidden',
//     marginBottom: '20px',
//     backgroundColor: '#f0f0f0',
//     position: 'relative',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     objectFit: 'cover',
//     transition: 'transform 0.3s ease',
//   },
//   name: {
//     fontSize: '1.2rem',
//     fontWeight: '600',
//     marginBottom: '12px',
//     color: '#Ffa500',
//     fontFamily: '"Abril Extra Bold", sans-serif', // Applied to headings (replacing Roboto)
//   },
// };

// export default ProductGrid;

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product, styles, uniqueKeySuffix = "" }) => (
	<div
		key={`${product.id}${uniqueKeySuffix}`} 
		style={styles.card}
		className="product-item" 
	>
		<Link
			to={`/product/${product.id}`}
			style={{ textDecoration: "none", color: "inherit" }}
		>
			<div style={styles.imageWrapper}>
				<img
					src={getImageFromMedia(product.media_urls)}
					alt={product.name}
					style={styles.image}
				/>
			</div>
		</Link>
		<h3 style={styles.name}>{product.name}</h3>
	</div>
);

const getImageFromMedia = (mediaUrls) => {
	if (Array.isArray(mediaUrls)) {
		const imageUrl = mediaUrls.find((url) =>
			url.match(/\.(jpeg|jpg|png|gif|webp)$/i)
		);
		return imageUrl
			? imageUrl
			: "https://via.placeholder.com/300x500?text=No+Image";
	}
	return "https://via.placeholder.com/300x500?text=No+Image";
};

const ProductGrid = ({
	singleLine = false,
	isMobile: isMobileProp = false,
}) => {
	const [products, setProducts] = useState([]);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	useEffect(() => {
		const handleResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const isMobile = isMobileProp || windowWidth < 768;

	useEffect(() => {
		const mockData = Array.from({ length: 6 }, (_, i) => ({
			id: `prod-${i + 1}`,
			name: `Product Name ${i + 1}`,
			created_at: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString(), 
			media_urls: [
				"https://via.placeholder.com/300x500/eee/888?text=Product+" + (i + 1),
			], 
		}));
		const sorted = [...mockData].sort(
			(a, b) => new Date(b.created_at) - new Date(a.created_at)
		);
		setProducts(sorted.slice(0, 6)); 

		fetch("https://nine-ymmn.onrender.com/api/products")
			.then((response) => response.json())
			.then((data) => {
				const sorted = [...data].sort(
					(a, b) => new Date(b.created_at) - new Date(a.created_at)
				);
				setProducts(sorted.slice(0, 6)); // Get latest 6 products
			})
			.catch((error) => console.error("Error fetching products:", error));
	}, []);

	const getStyles = () => {
		const baseStyles = { ...styles }; 

		if (isMobile) {
			baseStyles.grid = {
				...styles.grid,
				gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
				gap: "15px",
				padding: "20px 10px",
			};
			baseStyles.singleLineContainer = {
				...styles.singleLineContainer,
				gap: "15px",
				padding: "20px 0", 
			};
			baseStyles.card = {
				...styles.card,
				padding: "10px",
				width: "200px", 
				flexShrink: 0, 
			};
			baseStyles.imageWrapper = {
				...styles.imageWrapper,
				height: "270px",
				width: "180px", 
				marginBottom: "10px",
			};
			baseStyles.name = {
				...styles.name,
				fontSize: "1rem",
			};
		} else {
			baseStyles.card = {
				...styles.card,
				flexShrink: 0,
			};
		}

		return baseStyles;
	};

	const currentStyles = getStyles();

	const containerStyle = singleLine
		? currentStyles.singleLineContainer
		: currentStyles.grid;

	const itemsToRender = singleLine ? [...products, ...products] : products;

	return (
		<div style={containerStyle}>
			{products.map((product) => (
				<ProductCard
					key={product.id}
					product={product}
					styles={currentStyles}
				/>
			))}
			{singleLine &&
				products.map((product) => (
					<ProductCard
						key={`${product.id}-duplicate`}
						product={product}
						styles={currentStyles}
					/>
				))}
		</div>
	);
};

const styles = {
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
		gap: "30px",
		padding: "40px 20px",
		width: "100%", 
	},
	singleLineContainer: {
		display: "flex",
		flexDirection: "row",
		flexWrap: "nowrap", 
		gap: "30px",
		padding: "40px 0px", 
	},
	card: {
		padding: "20px",
		textAlign: "center",
		boxShadow: "none",
		transition: "transform 0.2s ease",
		position: "relative",
		overflow: "hidden",
		width: "320px", 
		flexShrink: 0,
	},
	imageWrapper: {
		height: "400px",
		width: "280px",
		margin: "0 auto", 
		overflow: "hidden",
		marginBottom: "20px",
		backgroundColor: "#f0f0f0",
		position: "relative",
	},
	image: {
		width: "100%",
		height: "100%",
		objectFit: "cover",
		transition: "transform 0.3s ease",
		display: "block", 
	},
	name: {
		fontSize: "1.2rem",
		fontWeight: "600",
		marginBottom: "12px",
		color: "#Ffa500",
		fontFamily: '"Abril Extra Bold", sans-serif',
		whiteSpace: "nowrap", 
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
};

export default ProductGrid;

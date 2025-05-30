import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product, styles, uniqueKeySuffix = "" }) => {
	const [isLoading, setIsLoading] = useState(true);
  
	return (
		<>
		  <style>
			{`
			  @keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			  }
			`}
		  </style>
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
			{isLoading && (
			  <div
				style={{
				  position: "absolute",
				  top: 0,
				  left: 0,
				  width: "100%",
				  height: "100%",
				  backgroundColor: "#f0f0f0",
				  display: "flex",
				  alignItems: "center",
				  justifyContent: "center",
				}}
			  >
				<div
				  style={{
					border: "4px solid #ccc",
					borderTop: "4px solid #Ffa500",
					borderRadius: "50%",
					width: "30px",
					height: "30px",
					animation: "spin 1s linear infinite",
				  }}
				/>
			  </div>
			)}
			<img
			  src={getImageFromMedia(product.media_urls)}
			  alt={product.name}
			  style={{
				...styles.image,
				opacity: isLoading ? 0 : 1,
			  }}
			  onLoad={() => setIsLoading(false)}
			  onError={() => setIsLoading(false)}
			/>
		  </div>
		</Link>
		<h3 style={styles.name}>{product.name}</h3>
			</div>
			</>
	);
};

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
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState(null);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	useEffect(() => {
		const handleResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const isMobile = isMobileProp || windowWidth < 768;

	useEffect(() => {
		setIsLoading(true);
		fetch("https://nine-ymmn.onrender.com/api/products")
			.then((response) => {
				if (!response.ok) {
					throw new Error("Failed to fetch products");
				}
				return response.json();
			})
			.then((data) => {
				const sorted = [...data].sort(
					(a, b) => new Date(b.created_at) - new Date(a.created_at)
				);
				setProducts(sorted.slice(0, 6));
				setIsLoading(false);
			})
			.catch((error) => {
				// console.error("Error fetching products:", error);
				setError(error.message);
				setIsLoading(false);
			});
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

	if (isLoading) {
		return (
			<div style={{ textAlign: "center", padding: "40px" }}>
				<div
					style={{
						border: "4px solid #ccc",
						borderTop: "4px solid #Ffa500",
						borderRadius: "50%",
						width: "40px",
						height: "40px",
						animation: "spin 1s linear infinite",
						margin: "0 auto",
					}}
				/>
				<p>Loading products...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ textAlign: "center", padding: "40px", color: "#ff0000" }}>
				<p>Error: {error}. Please try again later.</p>
			</div>
		);
	}

	return (
		<div style={containerStyle}>
			{products.map((product) => (
				<ProductCard
					key={product.id}
					product={product}
					styles={currentStyles}
					uniqueKeySuffix={singleLine ? "-single" : ""}
				/>
			))}
			{singleLine &&
				products.map((product) => (
					<ProductCard
						key={`${product.id}-duplicate`}
						product={product}
						styles={currentStyles}
						uniqueKeySuffix="-duplicate"
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
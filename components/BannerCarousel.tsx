import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors, ShowcaseDesign } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');
const BANNER_HEIGHT = 108; // 0.9x of original 120
const BANNER_WIDTH = (screenWidth - 40) * 0.9; // 0.9x of original width
const AUTO_SCROLL_INTERVAL = 5000; // 5 seconds

interface Banner {
  _id: string;
  title: string;
  description?: string;
  image_url: string;
  order: number;
  is_active: boolean;
}

interface BannerCarouselProps {
  banners: Banner[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

export default function BannerCarousel({ banners, loading, error, onRefresh }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const isAutoScrolling = useRef(false);

  // Auto-scroll functionality
  useEffect(() => {
    if (banners.length > 1) {
      startAutoScroll();
    }
    return () => stopAutoScroll();
  }, [banners.length]);

  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollTimer.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        // Set flag to prevent handleScroll from updating index
        isAutoScrolling.current = true;
        // Scroll to the next banner
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: nextIndex * BANNER_WIDTH,
            animated: true,
          });
        }
        // Reset flag after animation completes
        setTimeout(() => {
          isAutoScrolling.current = false;
        }, 500); // Animation duration
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
    isAutoScrolling.current = false;
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current && banners.length > 0) {
      scrollViewRef.current.scrollTo({
        x: index * BANNER_WIDTH,
        animated: true,
      });
    }
  };

  const handleScroll = (event: any) => {
    // Don't update index if we're auto-scrolling
    if (isAutoScrolling.current) {
      return;
    }
    
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / BANNER_WIDTH);
    if (index !== currentIndex && index >= 0 && index < banners.length) {
      setCurrentIndex(index);
    }
  };


  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BrandColors.primary} />
          <Text style={styles.loadingText}>Loading banners...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={BrandColors.error} />
          <Text style={styles.errorText}>Failed to load banners</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          {onRefresh && (
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Empty state
  if (!banners || banners.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="image" size={48} color={BrandColors.mediumGray} />
          <Text style={styles.emptyText}>No banners available</Text>
          <Text style={styles.emptySubtext}>Check back later for updates</Text>
          {onRefresh && (
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={stopAutoScroll}
        onTouchEnd={() => {
          if (banners.length > 1) {
            startAutoScroll();
          }
        }}
        style={styles.carousel}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        snapToAlignment="start"
      >
        {banners.map((banner, index) => (
          <View
            key={banner._id}
            style={styles.bannerContainer}
          >
            <Image
              source={{ uri: banner.image_url }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  carousel: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: ShowcaseDesign.borderRadius.medium,
    overflow: 'hidden',
  },
  bannerContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.lightGray,
  },
  paginationDotActive: {
    backgroundColor: BrandColors.primary,
    width: 24,
  },
  loadingContainer: {
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.offWhite,
    borderRadius: ShowcaseDesign.borderRadius.medium,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: BrandColors.mediumGray,
  },
  errorContainer: {
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.offWhite,
    borderRadius: ShowcaseDesign.borderRadius.medium,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.error,
    marginTop: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: BrandColors.mediumGray,
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: BrandColors.primary,
    borderRadius: ShowcaseDesign.borderRadius.small,
  },
  retryButtonText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    height: BANNER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BrandColors.offWhite,
    borderRadius: ShowcaseDesign.borderRadius.medium,
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.mediumGray,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: BrandColors.lightGray,
    marginTop: 4,
    textAlign: 'center',
  },
});

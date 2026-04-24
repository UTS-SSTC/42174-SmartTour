"use client";

/**
 * Daily photo gallery rendering for itinerary places.
 */

import { useMemo, useState } from "react";
import Image from "next/image";
import { ImageOff, LoaderCircle } from "lucide-react";
import { buildGalleryPlaces, type GalleryPlace } from "@/lib/placePhotos";
import type { ItineraryDay } from "@/lib/smartourApi";
import styles from "@/app/page.module.css";

type DailyPhotoGalleryProps = {
  activeDay: ItineraryDay | null;
  isPlanning: boolean;
};

/**
 * Render a photo gallery for the active itinerary day.
 *
 * @param props - The daily gallery props.
 * @returns The daily photo gallery element.
 */
export function DailyPhotoGallery({
  activeDay,
  isPlanning,
}: DailyPhotoGalleryProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const galleryPlaces = useMemo(
    () => buildGalleryPlaces(activeDay, apiKey),
    [activeDay, apiKey],
  );

  if (activeDay === null || galleryPlaces.length === 0) {
    return <EmptyGalleryState isPlanning={isPlanning} />;
  }

  return (
    <section
      className={styles.galleryContainer}
      aria-label="Daily place photos"
    >
      <div className={styles.galleryHeader}>
        <div>
          <h2 className={styles.galleryTitle}>Day {activeDay.day_number}</h2>
          <div className={styles.gallerySubtitle}>{activeDay.theme}</div>
        </div>
        <div className={styles.galleryCount}>
          {activeDay.items.length} places
        </div>
      </div>
      <div className={styles.galleryGrid}>
        {galleryPlaces.map((galleryPlace, index) => (
          <GalleryTile
            galleryPlace={galleryPlace}
            index={index}
            key={galleryPlace.id}
          />
        ))}
      </div>
    </section>
  );
}

type EmptyGalleryStateProps = {
  isPlanning: boolean;
};

/**
 * Render the gallery empty or loading state.
 *
 * @param props - The empty gallery state props.
 * @returns The empty gallery element.
 */
function EmptyGalleryState({ isPlanning }: EmptyGalleryStateProps) {
  return (
    <section
      className={styles.galleryContainer}
      aria-label="Daily place photos"
    >
      <div className={styles.galleryEmpty}>
        {isPlanning ? (
          <LoaderCircle className={styles.spin} size={32} />
        ) : (
          <ImageOff size={42} />
        )}
        <span>
          {isPlanning ? "Generating place photos" : "No itinerary yet"}
        </span>
      </div>
    </section>
  );
}

type GalleryTileProps = {
  galleryPlace: GalleryPlace;
  index: number;
};

/**
 * Render one gallery tile for an itinerary place.
 *
 * @param props - The gallery tile props.
 * @returns A gallery tile element.
 */
function GalleryTile({ galleryPlace, index }: GalleryTileProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const { item, photoUrl } = galleryPlace;
  const shouldShowImage = photoUrl !== null && !hasImageError;
  return (
    <article
      className={`${styles.galleryTile} ${
        index === 0 ? styles.galleryTileFeature : ""
      }`}
    >
      {shouldShowImage ? (
        <Image
          alt={item.place.name}
          className={styles.galleryImage}
          fill
          loading={index === 0 ? "eager" : "lazy"}
          onError={() => setHasImageError(true)}
          sizes="(max-width: 900px) 50vw, 33vw"
          src={photoUrl}
          unoptimized
        />
      ) : (
        <div className={styles.galleryPlaceholder}>
          <ImageOff size={28} />
          <span>{item.place.category}</span>
        </div>
      )}
      <div className={styles.galleryTileMeta}>
        <div className={styles.galleryTileName}>{item.place.name}</div>
      </div>
    </article>
  );
}

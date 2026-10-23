import { Copy } from "@/content/Copy";
import { ScreenAssets, type ScreenId } from "@/lib/ScreenAssets";
import styles from "./ScreenImage.module.css";

type Props = {
  id: ScreenId;
  altSlot: string;
  sizes: string;
  priority?: boolean;
};

export function ScreenImage({ id, altSlot, sizes, priority = false }: Props) {
  const meta = ScreenAssets.meta(id);
  return (
    <div className={styles.frame}>
      <picture>
        <source
          type="image/avif"
          srcSet={ScreenAssets.srcSet(id, "avif")}
          sizes={sizes}
        />
        <source
          type="image/webp"
          srcSet={ScreenAssets.srcSet(id, "webp")}
          sizes={sizes}
        />
        <img
          className={styles.img}
          src={ScreenAssets.file(id, "webp", 1)}
          alt={Copy.text(altSlot)}
          width={meta.width}
          height={meta.height}
          sizes={sizes}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
      </picture>
    </div>
  );
}

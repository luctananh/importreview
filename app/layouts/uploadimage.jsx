import { useEffect, useRef } from "react";
import { useEnv } from "../server/use-env.js";
import { Button } from "@nextui-org/react";
import "../styles/insert_product.css";

let cloudinary;

function UploadWidget({ onUpload }) {
  const ENV = useEnv();
  const widget = useRef();

  useEffect(() => {
    if (!cloudinary) {
      cloudinary = window.cloudinary;
    }

    function onIdle() {
      if (!widget.current) {
        widget.current = createWidget();
      }
    }

    "requestIdleCallback" in window
      ? requestIdleCallback(onIdle)
      : setTimeout(onIdle, 1);

    return () => {
      widget.current?.destroy();
      widget.current = undefined;
    };
  }, []);

  function createWidget() {
    const cloudName = ENV.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = ENV.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.warn(
        `Vui lòng kiểm tra cloudName và UploadPreset trong file .env.`
      );
      return;
    }

    const options = {
      cloudName,
      uploadPreset,
    };

    return cloudinary.createUploadWidget(options, function (error, result) {
      if (error) {
        console.error("Upload error:", error);
        onUpload(null, error); // Gọi onUpload với thông tin lỗi
      } else if (result.event === "success") {
        // Gọi onUpload với URL của ảnh đã upload
        onUpload(result.info.secure_url, null); // Không có lỗi
      }
    });
  }

  function open() {
    if (!widget.current) {
      widget.current = createWidget();
    }

    widget.current && widget.current.open();
  }

  return (
    <Button size="sm" onClick={open} className="button_uploand">
      <img src="/upload.svg" alt="uploand_image" />
    </Button>
  );
}

export default UploadWidget;

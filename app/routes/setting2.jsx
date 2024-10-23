import { Select, SelectItem } from "@nextui-org/react";
import { Reviews } from "../server/data.js";
import "../styles/setting.css";
export default function Setting() {
  return (
    <>
      <div className="setting_body">
        <div className="setting_card">
          <span>Review quantity per import</span>
          <Select
            isRequired
            label="Reviews import"
            placeholder="Select reviews quantity per import"
            defaultSelectedKeys={["20"]}
            className="max-w-xs"
          >
            {Reviews.map((Review) => (
              <SelectItem key={Review.key}>{Review.label}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="setting_card">
          <span>Review quantity per import</span>
          <Select
            isRequired
            label="Reviews import"
            placeholder="Select reviews quantity per import"
            defaultSelectedKeys={["20"]}
            className="max-w-xs"
          >
            {Reviews.map((Review) => (
              <SelectItem key={Review.key}>{Review.label}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="setting_card">
          <span>Review quantity per import</span>
          <Select
            isRequired
            label="Reviews import"
            placeholder="Select reviews quantity per import"
            defaultSelectedKeys={["20"]}
            className="max-w-xs"
          >
            {Reviews.map((Review) => (
              <SelectItem key={Review.key}>{Review.label}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="setting_card">
          <span>Review quantity per import</span>
          <Select
            isRequired
            label="Reviews import"
            placeholder="Select reviews quantity per import"
            defaultSelectedKeys={["20"]}
            className="max-w-xs"
          >
            {Reviews.map((Review) => (
              <SelectItem key={Review.key}>{Review.label}</SelectItem>
            ))}
          </Select>
        </div>
        <div className="setting_card">
          <span>Review quantity per import</span>
          <Select
            isRequired
            label="Reviews import"
            placeholder="Select reviews quantity per import"
            defaultSelectedKeys={["20"]}
            className="max-w-xs"
          >
            {Reviews.map((Review) => (
              <SelectItem key={Review.key}>{Review.label}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </>
  );
}

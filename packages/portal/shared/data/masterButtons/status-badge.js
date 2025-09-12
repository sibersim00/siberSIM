import React from "react";
import { Badge } from "react-bootstrap";

const StatusBadgeRenderer = (props) => {
  const { propsVal } = props;

  return (
    <div style={{ marginTop: "-3px" }}>
      {propsVal.value == "Pending" ? (
        <Badge className="rounded-pill bg-primary">{propsVal.value}</Badge>
      ) : propsVal.value == "On Hold" ? (
        <Badge className="rounded-pill bg-warning">{propsVal.value}</Badge>
      ) : propsVal.value == "Approved" ? (
        <Badge className="rounded-pill bg-success"> {propsVal.value}</Badge>
      ) : propsVal.value === "Rejected" ? (
        <Badge className="rounded-pill bg-danger"> {propsVal.value}</Badge>
      ) : propsVal.value === "In Process" ? (
        <Badge className="rounded-pill bg-secondary"> {propsVal.value}</Badge>
      ) : propsVal.value === "Confirmed" ? (
        <Badge className="rounded-pill bg-success"> {propsVal.value}</Badge>
      ) : propsVal.value === "Submitted" ? (
        <Badge className="rounded-pill bg-info"> {propsVal.value}</Badge>
      ):
      (
        <Badge className="rounded-pill bg-warning"> {propsVal.value}</Badge>
      )}
    </div>
  );
};

export default StatusBadgeRenderer;

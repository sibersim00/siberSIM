import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Row, Col, Accordion, Badge } from "react-bootstrap";
import { getFaqList } from "../../../shared/redux/slices/common/masters";
import Seo from "../../../shared/layout-components/seo/seo";
import crossEvalicon from "../../../public/assets/img/svgs/crosseval.svg";


const Faq = () => {
  const dispatch = useDispatch();

  const hasGetFaqListSucc = useSelector((state) => {
    const data = state?.faqs?.getFaqData?.data;
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === "object") {
      return [data];
    }
    return [];
  });

  useEffect(() => {
    dispatch(getFaqList());
  }, [dispatch]);

  const sortedFaqs = [...hasGetFaqListSucc].sort((a, b) => a.order_by - b.order_by);

  return (
      <>
    <Seo title="FAQ" />
    <Row className="row-sm">
      <Col sm={12} md={12}>
        <Card className="custom-card accordion-faq">
          <Card.Body>
            <div>
              <h6 className="mb-1">FAQs</h6>
            </div>

            {sortedFaqs.length === 0 ? (
              <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "60vh", flexDirection: "column" }}
              >
                <img
                  src={crossEvalicon.src}
                  alt="No data"
                  className="wd-150 mt-5"
                />
                <h5 className="mt-4">No data found.</h5>
              </div>
            ) : (
              <div
                aria-multiselectable="true"
                className="accordion mt-4"
                id="accordion"
                role="tablist"
              >
                <Accordion defaultActiveKey="0">
                  {sortedFaqs.map((item, index) => (
                    <Accordion.Item eventKey={index.toString()} key={index}>
                      <Accordion.Header>
                        {index + 1}. {item.question}
                      </Accordion.Header>
                      <Accordion.Body>{item.answer}</Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  </>
  );
};

Faq.layout = "Contentlayout";
export default Faq;

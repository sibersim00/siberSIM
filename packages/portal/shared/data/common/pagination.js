import React from "react";
import Pagination from "react-bootstrap/Pagination";

const PaginationComponent = ({ currentPage, totalPages, handlePageChange }) => {
  const maxPagesToShow = 5;

  // const getPageItems = () => {
  //   const items = [];

  //   if (
  //     currentPage > Math.floor(maxPagesToShow / 2) + 1 &&
  //     totalPages > maxPagesToShow
  //   ) {
  //     items.push(<Pagination.Ellipsis key="ellipsis-start" disabled />);
  //   }

  //   const start = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
  //   const end = Math.min(start + maxPagesToShow - 1, totalPages);

  //   for (let i = start; i <= end; i++) {
  //     items.push(
  //       <Pagination.Item
  //         key={i}
  //         onClick={() => handlePageChange(i)}
  //         active={currentPage === i}
  //       >
  //         {i}
  //       </Pagination.Item>,
  //     );
  //   }

  //   if (
  //     totalPages - currentPage > Math.floor(maxPagesToShow / 2) &&
  //     totalPages > maxPagesToShow
  //   ) {
  //     items.push(<Pagination.Ellipsis key="ellipsis-end" disabled />);
  //   }
  //   return items;
  // };

  return (
    <div className="paginationsty">
      <Pagination className="pagination-radius mb-0">
        <Pagination.Item
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          <i className="fas fa-angle-double-left fa-lg"></i>
        </Pagination.Item>
        <Pagination.Item
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fas fa-angle-left fa-lg"></i>
        </Pagination.Item>

        <div className="mx-2 my-auto">
          Page {currentPage} of {totalPages}
        </div>

        <Pagination.Item
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="fas fa-angle-right fa-lg"></i>
        </Pagination.Item>
        <Pagination.Item
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <i className="fas fa-angle-double-right fa-lg"></i>
        </Pagination.Item>
      </Pagination>
    </div>
  );
};

export default PaginationComponent;

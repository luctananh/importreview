import { json } from "@remix-run/node";
import { prisma } from "../server/db.server";
import axios from "axios";
import * as cheerio from "cheerio";

export async function action({ request, formData }) {
  const formBody = new URLSearchParams(await request.text());
  const link = formBody.get("productURL");
  const actionType = formBody.get("_actionType");
  const productId = formBody.get("productId");
  console.log("Received _actionType:", actionType);
  console.log("Received productURL:", link);
  console.log("Received productID:", productId);

  if (!link || !productId) {
    return json(
      { error: "Please enter a product link and product ID!" },
      { status: 400 }
    );
  }

  try {
    const setting = await prisma.setting.findFirst();
    const maxReviewCount = setting ? setting.maxReviewCount : 20; // Nếu không có cài đặt, mặc định là 20

    console.log("Max Review Count from setting:", maxReviewCount); // Kiểm tra giá trị maxReviewCount từ setting

    const parts = link.split("/");
    const lastSegment = parts.pop() || parts.pop();
    const aliProductId = lastSegment.split(".")[0];

    let allReviews = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage && allReviews.length < 30) {
      const feedbackUrl = `https://feedback.aliexpress.com/display/productEvaluation.htm?v=2&productId=${aliProductId}&ownerMemberId=2668009148&companyId=2668009148&memberType=seller&startValidDate=&i18n=true&page=${page}`;

      const response = await axios.get(feedbackUrl);
      const $ = cheerio.load(response.data);

      const reviews = $(".feedback-item")
        .map((index, element) => {
          let reviewName =
            $(element).find(".fb-user-info .user-name a").text() ||
            $(element).find(".fb-user-info .user-name").text();
          let reviewCountry = $(element)
            .find(".fb-user-info .user-country b")
            .text();
          let reviewContent = $(element)
            .find(".buyer-feedback span:nth-child(1)")
            .text();
          let reviewTime = $(element)
            .find(".buyer-feedback span:nth-child(2)")
            .text();
          let reviewRating = $(element).find(".star-view span").attr("style");

          let reviewImage =
            $(element).find(".feedback-photo img").attr("src") ||
            $(element).find("img").attr("src");

          let reviewRatingValue;
          switch (reviewRating) {
            case "width:100%":
              reviewRatingValue = "5";
              break;
            case "width:80%":
              reviewRatingValue = "4";
              break;
            case "width:60%":
              reviewRatingValue = "3";
              break;
            case "width:40%":
              reviewRatingValue = "2";
              break;
            case "width:20%":
              reviewRatingValue = "1";
              break;
            default:
              reviewRatingValue = "5";
          }

          return {
            name: reviewName,
            country: reviewCountry,
            rating: reviewRatingValue,
            time: reviewTime,
            feedback: reviewContent,
            image: reviewImage,
          };
        })
        .get();

      for (let review of reviews) {
        if (allReviews.length >= parseInt(maxReviewCount)) break; // Kiểm tra nếu đã đủ 30 đánh giá

        await prisma.review.create({
          data: {
            userName: review.name,
            userAvatar: "",
            userContry: review.country,
            productImage: review.image,
            reviewContent: review.feedback,
            rating: review.rating,
            productId: productId,
          },
        });
      }

      allReviews = allReviews.concat(reviews);

      if (allReviews.length >= parseInt(maxReviewCount)) break; // Dừng nếu đủ 30 đánh giá

      const nextPageButton = $(
        ".ui-pagination-next:not(.ui-pagination-disabled)"
      );
      hasNextPage = nextPageButton.length > 0;
      page++;

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return json({ success: "Reviews fetched successfully!" });
  } catch (error) {
    console.error("Server Error:", error.message);
    return json(
      { error: "An error occurred while fetching reviews" },
      { status: 500 }
    );
  }
}

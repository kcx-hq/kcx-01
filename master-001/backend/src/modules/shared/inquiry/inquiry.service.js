import { Inquiry } from "../../../models/index.js";

export const createInquiry = async (inquiryData) => {
    return await Inquiry.create(inquiryData);
}


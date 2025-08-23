import express from "express";
const router = express.Router();
import Thread from '../models/Thread.js';
import getOpenAIAPIResponse from '../utils/openai.js';

//test
router.post("/test", async (req, res) => {
    try{
        const thread = new Thread({
            threadId:"abc",
            title:"sample thread data"
        });

        const response = await thread.save();
        res.send(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to save in DB!"});
    }
});

//get all threads
router.get("/thread", async (req, res) => {
    try{
        const threads = await Thread.find({}).sort({updatedAt: -1});
        res.json(threads);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to get thread!"});
    }
});

//fetch chat
router.get("/thread/:threadId", async (req, res) => {
    const {threadId} = req.params;
    try{
        const thread = await Thread.find({threadId});
        if(!thread){
            res.status(404).json({error:"Thread not found!"});
        }
        res.json(thread);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to fetch chat!"});
    }
});

//delete chat
router.delete("/thread/:threadId", async (req, res) => {
    const {threadId} = req.params;
    try{
        const deletedThread = await Thread.findOneAndDelete({threadId});
        if(!deletedThread){
            res.status(404).json({error:"Thread not found!"});
        }
        res.status(200).json({error:"Success! Thread deleted!"});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to delete!"});
    }
});

//create chat
router.post("/chat", async (req, res) => {
        const {threadId, message} = req.body;

    if(!threadId || !message) {
        res.status(400).json({error: "missing required fields"});
    }

    try {
        let thread = await Thread.findOne({threadId});

        if(!thread) {
            //create a new thread in Db
            thread = new Thread({
                threadId,
                title: message,
                messages: [{role: "user", content: message}]
            });
        } else {
            thread.messages.push({role: "user", content: message});
        }

        const assistantReply = await getOpenAIAPIResponse(message);

        thread.messages.push({role: "assistant", content: assistantReply});
        thread.updatedAt = new Date();

        await thread.save();
        res.json({reply: assistantReply});
    } catch(err) {
        console.log(err);
        res.status(500).json({error: "something went wrong"});
    }
});

export default router;
const cors = require('cors')
const express = require('express')
const Apollo = require('apollo-server-express')
const app = express()
const port = 3000


const {
    Sequelize,
    Model,
    DataTypes
} = require('sequelize');
const sequelize = new Sequelize('joaoferr_dtam', 'joaoferr_dtam', '5SNhnBGKPUJTYy2M', {
    host: 'www.joaoferreira.eu',
    dialect: 'mysql'
});

const User_GQL = sequelize.define('gql_user', {
    username: {
        type: DataTypes.STRING
    }

})

const Message_GQL = sequelize.define('gql_message', {
    text: {
        type: DataTypes.STRING
    }

})

User_GQL.hasMany(Message_GQL);
Message_GQL.belongsTo(User_GQL);

const schema = Apollo.gql `
    type Query {
        me: User
        user(id: ID!): User
        users: [User!]

        message(id: ID!): Message
        messages: [Message!]
    }

    type User {
        id: ID!
        username: String!
        special: String!
        messages: [Message!]
    }

    type Message {
        id: ID!
        text: String!
        user: User!
    }

    type Mutation {
        createMessage(text: String!, userID: ID!): Message!
        deleteMessage(id: ID!): Boolean!
    }
`;

const resolvers = {
    Query: {
        me: async () => {
            return await User_GQL.findByPk(1)
        },        
        user: async (parent, {id}) => {
            return await User_GQL.findByPk(id)
        }, 
        users: async () => {
            return await User_GQL.findAll()
        },
        message: async (parent, {id}) => {
            return await Message_GQL.findByPk(id)
        },
        messages: async () => {
            return await Message_GQL.findAll()
        }
    },

    Mutation: {
        createMessage: async (parent, {text, userID}) => {
            return await Message_GQL.create({
                text: text, 
                gqlUserId: userID
            })
        },
        deleteMessage: async (parent, {id}) => {
            return await Message_GQL.destroy({
                where: { id: id }
            })
        }
    },

    User: {
        messages: async user => {
            return await Message_GQL.findAll({
                where: {
                    gqlUserId: user.id
                }
            })
        }
    },

    Message: {
        user: async message => {
            return await User_GQL.findByPk(message.gqlUserId)
        }
    }
};

const server = new Apollo.ApolloServer({
    typeDefs: schema,
    resolvers
});

server.applyMiddleware({
    app,
    path: '/graphql'
});
app.use(cors());
app.listen(port, function () {
    console.log("Apollo Server on localhost:" + port + "/graphql");
    sequelize.sync().then().catch(error => {
        console.log(error); 
    })    
})